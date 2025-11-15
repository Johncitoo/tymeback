import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment, PaymentMethodEnum } from './entities/payment.entity';
import { PaymentItem } from './entities/payment-item.entity';
import { User, RoleEnum } from '../users/entities/user.entity';
import { Plan } from '../plans/entities/plan.entity';
import { MembershipsService } from '../memberships/memberships.service';
import { CommunicationsService } from '../communications/communications.service';
import { CreatePaymentDto } from './dto/create-payment.dto';

function computeNetVatFromGrossCLP(gross: number) {
  const net = Math.round(gross / 1.19);
  const vat = gross - net;
  return { net, vat };
}

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(Payment) private readonly repo: Repository<Payment>,
    @InjectRepository(PaymentItem) private readonly itemsRepo: Repository<PaymentItem>,
    @InjectRepository(User) private readonly usersRepo: Repository<User>,
    @InjectRepository(Plan) private readonly plansRepo: Repository<Plan>,
    private readonly memberships: MembershipsService,
    private readonly commsService: CommunicationsService,
  ) {}

  private async assertAdmin(byUserId: string, gymId: string) {
    const u = await this.usersRepo.findOne({ where: { id: byUserId, gymId } });
    if (!u) throw new NotFoundException('Usuario no pertenece al gimnasio');
    if (u.role !== RoleEnum.ADMIN) throw new BadRequestException('Solo ADMIN puede registrar pagos');
    return u;
  }

  async create(dto: CreatePaymentDto) {
    const paidAt = new Date(dto.paidAt);
    if (Number.isNaN(paidAt.getTime())) throw new BadRequestException('paidAt inválido');

    // Verificar que el usuario existe antes de asignarlo
    const processedByUser = await this.usersRepo.findOne({ 
      where: { id: dto.createdByUserId, gymId: dto.gymId } 
    });

    // Obtener el plan para calcular el monto
    const plan = await this.plansRepo.findOne({ where: { id: dto.planId } });
    if (!plan) throw new NotFoundException('Plan no encontrado');

    const pay = this.repo.create({
      gymId: dto.gymId,
      method: dto.method ?? PaymentMethodEnum.CASH,
      paidAt,
      totalAmountClp: plan.priceClp,
      notes: dto.note ?? null,
      receiptUrl: null,
      processedBy: processedByUser?.id ?? null,
    });

    const saved = await this.repo.save(pay);

    // Crear payment_item
    const paymentItem = this.itemsRepo.create({
      paymentId: saved.id,
      clientId: dto.clientId,
      planId: dto.planId,
      quantity: 1,
      unitPriceClp: plan.priceClp,
      discountClp: 0,
      finalAmountClp: plan.priceClp,
      promotionId: null,
    });

    await this.itemsRepo.save(paymentItem);

    // Enviar email de confirmación al cliente
    const client = await this.usersRepo.findOne({ where: { id: dto.clientId } });
    if (client?.email) {
      try {
        await this.commsService.sendPaymentConfirmation(
          dto.gymId,
          client.id,
          client.email,
          client.fullName,
          plan.name,
          plan.priceClp,
          paidAt.toISOString().slice(0, 10),
        );
      } catch (emailErr) {
        console.error('Error sending payment confirmation email:', emailErr);
        // No fallar el pago si el email falla
      }
    }

    return { 
      payment: saved,
      clientId: dto.clientId,
      planId: dto.planId,
    };
  }

  async findAll(gymId: string, limit: number = 100, offset: number = 0) {
    const [payments, total] = await this.repo.findAndCount({
      where: { gymId },
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
    });

    // Obtener los payment_items con sus relaciones
    const paymentsWithDetails = await Promise.all(
      payments.map(async (payment) => {
        const items = await this.itemsRepo.find({
          where: { paymentId: payment.id },
        });
        
        // Tomar el primer item (normalmente hay uno solo)
        const firstItem = items[0];
        
        // Obtener datos del cliente si existe
        let client: any = null;
        if (firstItem?.clientId) {
          const userRecord = await this.usersRepo.findOne({
            where: { id: firstItem.clientId },
            select: ['id', 'fullName', 'email', 'phone', 'avatarUrl'],
          });
          
          if (userRecord) {
            client = {
              id: userRecord.id,
              fullName: userRecord.fullName,
              email: userRecord.email,
              phone: userRecord.phone,
              avatar: userRecord.avatarUrl,
            };
          }
        }
        
        // Obtener datos del plan si existe
        let plan: any = null;
        if (firstItem?.planId) {
          const planRecord = await this.plansRepo.findOne({
            where: { id: firstItem.planId },
            select: ['id', 'name', 'priceClp'],
          });
          
          if (planRecord) {
            plan = {
              id: planRecord.id,
              name: planRecord.name,
              priceClp: planRecord.priceClp,
            };
          }
        }
        
        return {
          id: payment.id,
          gymId: payment.gymId,
          totalAmountClp: payment.totalAmountClp,
          paidAt: payment.paidAt,
          method: payment.method,
          notes: payment.notes,
          createdAt: payment.createdAt,
          clientId: firstItem?.clientId,
          planId: firstItem?.planId,
          client,
          plan,
        };
      })
    );

    return {
      data: paymentsWithDetails,
      total,
      page: Math.floor(offset / limit) + 1,
      limit,
    };
  }
}
