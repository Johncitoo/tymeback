import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment, PaymentMethodEnum } from './entities/payment.entity';
import { PaymentItem } from './entities/payment-item.entity';
import { User, RoleEnum } from '../users/entities/user.entity';
import { Plan } from '../plans/entities/plan.entity';
import { MembershipsService } from '../memberships/memberships.service';
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
  ) {}

  private async assertAdmin(byUserId: string, gymId: string) {
    const u = await this.usersRepo.findOne({ where: { id: byUserId, gymId } });
    if (!u) throw new NotFoundException('Usuario no pertenece al gimnasio');
    if (u.role !== RoleEnum.ADMIN) throw new BadRequestException('Solo ADMIN puede registrar pagos');
    return u;
  }

  async create(dto: CreatePaymentDto) {
    await this.assertAdmin(dto.createdByUserId, dto.gymId);

    const [client, plan] = await Promise.all([
      this.usersRepo.findOne({ where: { id: dto.clientId, gymId: dto.gymId } }),
      this.plansRepo.findOne({ where: { id: dto.planId, gymId: dto.gymId } }),
    ]);
    if (!client || client.role !== RoleEnum.CLIENT) throw new BadRequestException('Cliente inválido');
    if (!plan) throw new BadRequestException('Plan inválido');

    const paidAt = new Date(dto.paidAt);
    if (Number.isNaN(paidAt.getTime())) throw new BadRequestException('paidAt inválido');

    const now = new Date();
    if (paidAt.getTime() < now.getTime() - 60_000 /* 1min tolerancia */) {
      if (!dto.backdatingReason?.trim()) {
        throw new BadRequestException('backdatingReason requerido para pagos retroactivos');
      }
    }

    const total = plan.priceClp;
    const { net, vat } = computeNetVatFromGrossCLP(total);

    const pay = this.repo.create({
      gymId: dto.gymId,
      clientId: dto.clientId,
      planId: plan.id,
      method: dto.method ?? PaymentMethodEnum.CASH,
      paidAt,
      totalAmountClp: total,
      netAmountClp: net,
      vatAmountClp: vat,
      createdByUserId: dto.createdByUserId,
      backdatingReason: dto.backdatingReason ?? null,
      receiptFileId: dto.receiptFileId ?? null,
      note: dto.note ?? null,
      items: [],
    });

    const item = this.itemsRepo.create({
      paymentId: 'temp', // se corrige al salvar
      clientId: dto.clientId,
      planId: plan.id,
      quantity: 1,
      unitPriceClp: plan.priceClp,
      discountPercent: 0,
      totalClp: plan.priceClp,
    });

    // guardar pago primero para tener id
    const saved = await this.repo.save(pay);
    item.paymentId = saved.id;
    const savedItem = await this.itemsRepo.save(item);

    // crear membresía desde el plan con startDate = fecha de pago (local ISO)
    const startDateISO = paidAt.toISOString().slice(0, 10);
    const membership = await this.memberships.createFromPlan({
      gymId: dto.gymId,
      clientId: dto.clientId,
      planId: plan.id,
      startDate: startDateISO,
      note: `Creada por pago ${saved.id}`,
      byUserId: dto.createdByUserId,
    });

    // devolver todo junto
    return {
      payment: { ...saved, items: [savedItem] },
      membership,
    };
  }
}
