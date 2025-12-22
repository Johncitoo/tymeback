import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment, PaymentMethodEnum } from './entities/payment.entity';
import { PaymentItem } from './entities/payment-item.entity';
import { User, RoleEnum } from '../users/entities/user.entity';
import { GymUser } from '../gym-users/entities/gym-user.entity';
import { Plan } from '../plans/entities/plan.entity';
import { Client } from '../clients/entities/client.entity';
import { Membership } from '../memberships/entities/membership.entity';
import { MembershipsService } from '../memberships/memberships.service';
import { MembershipStatusService } from '../memberships/membership-status.service';
import { CommunicationsService } from '../communications/communications.service';
import { PromotionsService } from '../promotions/promotions.service';
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
    @InjectRepository(GymUser) private readonly gymUsersRepo: Repository<GymUser>,
    @InjectRepository(Plan) private readonly plansRepo: Repository<Plan>,
    @InjectRepository(Client) private readonly clientsRepo: Repository<Client>,
    @InjectRepository(Membership) private readonly membershipsRepo: Repository<Membership>,
    private readonly memberships: MembershipsService,
    private readonly membershipStatus: MembershipStatusService,
    private readonly commsService: CommunicationsService,
    private readonly promotionsService: PromotionsService,
  ) {}

  private async assertAdmin(byUserId: string, gymId: string) {
    const gymUser = await this.gymUsersRepo.findOne({ where: { userId: byUserId, gymId } });
    if (!gymUser) throw new NotFoundException('Usuario no pertenece al gimnasio');
    
    const u = await this.usersRepo.findOne({ where: { id: byUserId } });
    if (!u) throw new NotFoundException('Usuario no encontrado');
    
    if (gymUser.role !== RoleEnum.ADMIN) throw new BadRequestException('Solo ADMIN puede registrar pagos');
    return { ...u, role: gymUser.role };
  }

  async create(dto: CreatePaymentDto) {
    const paidAt = new Date(dto.paidAt);
    if (Number.isNaN(paidAt.getTime())) throw new BadRequestException('paidAt inválido');

    // Verificar que el usuario existe y pertenece al gimnasio
    const gymUser = await this.gymUsersRepo.findOne({
      where: { userId: dto.createdByUserId, gymId: dto.gymId }
    });
    if (!gymUser) throw new NotFoundException('Usuario no pertenece al gimnasio');
    
    const processedByUser = await this.usersRepo.findOne({ 
      where: { id: dto.createdByUserId } 
    });

    // Obtener el plan para calcular el monto y duración
    const plan = await this.plansRepo.findOne({ where: { id: dto.planId, gymId: dto.gymId } });
    if (!plan) throw new NotFoundException('Plan no encontrado');

    // Obtener el client (gym_user_id del cliente)
    const clientGymUser = await this.gymUsersRepo.findOne({
      where: { userId: dto.clientId, gymId: dto.gymId, role: RoleEnum.CLIENT }
    });
    if (!clientGymUser) throw new NotFoundException('Cliente no encontrado en este gimnasio');

    const client = await this.clientsRepo.findOne({
      where: { gymUserId: clientGymUser.id }
    });
    if (!client) throw new NotFoundException('Registro de cliente no encontrado');

    // ✅ CALCULAR DESCUENTOS Y PROMOCIONES
    let discountClp = 0;
    let promotionId: string | null = null;
    let promotionName: string | null = null;

    if (dto.promotionCode) {
      // Validar código promocional
      const validation = await this.promotionsService.validatePromotion(
        dto.gymId,
        dto.promotionCode,
        dto.planId,
      );

      if (!validation.valid) {
        throw new BadRequestException(validation.message);
      }

      if (validation.promotion) {
        discountClp = this.promotionsService.calculateDiscount(validation.promotion, plan.priceClp);
        promotionId = validation.promotion.id;
        promotionName = validation.promotion.name;
        // Incrementar contador de usos
        await this.promotionsService.incrementUsage(validation.promotion.id);
      }
    } else if (dto.manualDiscountClp && dto.manualDiscountClp > 0) {
      // Descuento manual
      discountClp = Math.min(dto.manualDiscountClp, plan.priceClp);
    }

    const finalAmountClp = plan.priceClp - discountClp;

    // 1. Crear el pago
    const pay = this.repo.create({
      gymId: dto.gymId,
      method: dto.method ?? PaymentMethodEnum.CASH,
      paidAt,
      totalAmountClp: finalAmountClp, // ✅ CON DESCUENTO APLICADO
      notes: dto.note ?? null,
      receiptUrl: null,
      receiptFileId: dto.receiptFileId ?? null,
      processedByUserId: processedByUser?.id ?? null,
    });

    const saved = await this.repo.save(pay);

    // 2. Crear payment_item
    const paymentItem = this.itemsRepo.create({
      gymId: dto.gymId,
      paymentId: saved.id,
      clientGymUserId: clientGymUser.id, // ✅ Usar gym_user_id del cliente
      planId: dto.planId,
      unitPriceClp: plan.priceClp,
      discountClp, // ✅ DESCUENTO
      finalAmountClp, // ✅ MONTO FINAL
      promotionId, // ✅ ID DE PROMOCIÓN SI APLICA
    });

    const savedItem = await this.itemsRepo.save(paymentItem);

    // 3. ✅ CREAR LA MEMBRESÍA AUTOMÁTICAMENTE
    // Buscar si el cliente tiene una membresía activa o futura
    const existingMemberships = await this.membershipsRepo.find({
      where: { clientGymUserId: clientGymUser.id },
      order: { endsOn: 'DESC' },
      take: 1,
    });

    let startsOn: string;
    const today = new Date().toISOString().slice(0, 10);

    if (existingMemberships.length > 0) {
      const lastMembership = existingMemberships[0];
      // Si tiene membresía activa o futura, la nueva empieza el día siguiente
      if (lastMembership.endsOn >= today) {
        const nextDay = new Date(lastMembership.endsOn);
        nextDay.setDate(nextDay.getDate() + 1);
        startsOn = nextDay.toISOString().slice(0, 10);
      } else {
        // Si ya expiró, empieza hoy
        startsOn = today;
      }
    } else {
      // Primera membresía, empieza hoy
      startsOn = today;
    }

    // Calcular fecha de fin usando MESES CALENDARIO (no días fijos)
    // Si plan.durationMonths existe, usar meses (5 feb → 5 mar)
    // Si solo tiene durationDays, usar días exactos (para planes semanales, etc.)
    let endsOn: string;
    
    if (plan.durationMonths && plan.durationMonths > 0) {
      // USAR MESES CALENDARIO - CORRECTO para facturación
      // Ejemplo: 5 de febrero + 1 mes = 5 de marzo (no 30 días)
      const endsOnDate = new Date(startsOn);
      endsOnDate.setMonth(endsOnDate.getMonth() + plan.durationMonths);
      endsOnDate.setDate(endsOnDate.getDate() - 1); // -1 día porque ends_on es INCLUSIVO
      endsOn = endsOnDate.toISOString().slice(0, 10);
    } else {
      // USAR DÍAS EXACTOS para planes no mensuales (semanal, quincenal, etc.)
      const durationDays = plan.durationDays ?? 30;
      const endsOnDate = new Date(startsOn);
      endsOnDate.setDate(endsOnDate.getDate() + durationDays - 1);
      endsOn = endsOnDate.toISOString().slice(0, 10);
    }

    // Crear la membresía
    const membership = this.membershipsRepo.create({
      gymId: dto.gymId,
      clientGymUserId: clientGymUser.id,
      planId: dto.planId,
      paymentItemId: savedItem.id,
      startsOn,
      endsOn,
      sessionsQuota: plan.privateSessionsPerPeriod ?? 0,
      sessionsUsed: 0,
    });

    await this.membershipsRepo.save(membership);

    console.log('✅ Membresía creada:', {
      clientId: dto.clientId,
      planName: plan.name,
      startsOn,
      endsOn,
      calculationMethod: plan.durationMonths ? `${plan.durationMonths} meses calendario` : `${plan.durationDays || 30} días exactos`,
      sessionsQuota: membership.sessionsQuota,
    });

    // 4. Activar usuario (marcar como activo al registrar pago)
    await this.membershipStatus.activateUserOnPayment(dto.clientId);

    // 5. Enviar email de confirmación al cliente
    const clientUser = await this.usersRepo.findOne({ where: { id: dto.clientId } });
    if (clientUser?.email) {
      try {
        const promoName = promotionId ? (await this.promotionsService.findOne(promotionId)).name : undefined;
        await this.commsService.sendPaymentConfirmation(
          dto.gymId,
          clientUser.id,
          clientUser.email,
          clientUser.fullName,
          plan.name,
          finalAmountClp,
          paidAt.toISOString().slice(0, 10),
          discountClp,
          promoName,
        );
      } catch (emailErr) {
        console.error('Error sending payment confirmation email:', emailErr);
        // No fallar el pago si el email falla
      }
    }

    return { 
      payment: saved,
      membership,
      clientId: dto.clientId,
      planId: dto.planId,
      startsOn,
      endsOn,
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
        if (firstItem?.clientGymUserId) {
          try {
            // Obtener el gym_user para luego obtener el user
            const gymUser = await this.gymUsersRepo.findOne({
              where: { id: firstItem.clientGymUserId },
            });
            
            if (gymUser?.userId) {
              const userRecord = await this.usersRepo.findOne({
                where: { id: gymUser.userId },
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
          } catch (err) {
            console.error('Error loading client for payment:', payment.id, err);
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
          receiptFileId: payment.receiptFileId, // ✅ INCLUIR
          createdAt: payment.createdAt,
          clientId: client?.id, // ✅ ID del usuario (no del gym_user)
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
