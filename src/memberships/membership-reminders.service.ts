import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual, MoreThanOrEqual, IsNull } from 'typeorm';
import { Membership } from '../memberships/entities/membership.entity';
import { User } from '../users/entities/user.entity';
import { Payment } from '../payments/entities/payment.entity';
import { Plan } from '../plans/entities/plan.entity';
import { GymUser } from '../gym-users/entities/gym-user.entity';
import { CommunicationsService } from '../communications/communications.service';

@Injectable()
export class MembershipRemindersService {
  constructor(
    @InjectRepository(Membership)
    private readonly membershipsRepo: Repository<Membership>,
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
    @InjectRepository(Payment)
    private readonly paymentsRepo: Repository<Payment>,
    @InjectRepository(Plan)
    private readonly plansRepo: Repository<Plan>,
    @InjectRepository(GymUser)
    private readonly gymUsersRepo: Repository<GymUser>,
    private readonly commsService: CommunicationsService,
  ) {}

  /**
   * Cron job que se ejecuta todos los días a las 9:00 AM
   * Envía recordatorios de vencimiento a 7, 3 y 1 día antes
   */
  @Cron('0 9 * * *') // Todos los días a las 9:00 AM
  async sendExpirationReminders() {
    console.log('[MembershipReminders] Iniciando envío de recordatorios...');

    const today = new Date();
    const daysToCheck = [7, 3, 1];

    for (const days of daysToCheck) {
      await this.sendRemindersForDays(days, today);
    }

    console.log('[MembershipReminders] Proceso completado');
  }

  private async sendRemindersForDays(daysBeforeExpiry: number, today: Date) {
    const targetDate = new Date(today);
    targetDate.setDate(targetDate.getDate() + daysBeforeExpiry);
    const targetDateStr = targetDate.toISOString().slice(0, 10);

    console.log(`[MembershipReminders] Buscando membresías que expiran el ${targetDateStr} (${daysBeforeExpiry} días)`);

    // Buscar membresías que expiran en la fecha objetivo
    const memberships = await this.membershipsRepo.find({
      where: {
        endsOn: targetDateStr,
      },
    });

    console.log(`[MembershipReminders] Encontradas ${memberships.length} membresías`);

    for (const membership of memberships) {
      try {
        // Obtener plan asociado
        const plan = await this.plansRepo.findOne({
          where: { id: membership.planId },
        });

        if (!plan) continue;

        // Obtener gym_user para encontrar el user_id
        const gymUser = await this.gymUsersRepo.findOne({
          where: { id: membership.clientGymUserId },
        });

        if (!gymUser) continue;

        // Verificar si el cliente ya tiene un pago registrado para el próximo período
        const hasNextPayment = await this.hasUpcomingPayment(
          membership.gymId,
          gymUser.userId,
          membership.planId,
          targetDateStr,
        );

        if (hasNextPayment) {
          console.log(`[MembershipReminders] Cliente ${gymUser.userId} ya tiene pago registrado, omitiendo`);
          continue;
        }

        // Obtener datos del usuario
        const user = await this.usersRepo.findOne({
          where: { id: gymUser.userId },
        });

        if (!user || !user.email) {
          console.log(`[MembershipReminders] Cliente ${gymUser.userId} no tiene email, omitiendo`);
          continue;
        }

        // Enviar recordatorio
        await this.commsService.sendExpirationReminder(
          membership.gymId,
          user.id,
          user.email,
          user.fullName,
          plan.name,
          targetDateStr,
          daysBeforeExpiry,
        );

        console.log(`[MembershipReminders] Recordatorio enviado a ${user.email} (${daysBeforeExpiry} días)`);
      } catch (error) {
        console.error(`[MembershipReminders] Error procesando membresía ${membership.id}:`, error);
      }
    }
  }

  /**
   * Verifica si el cliente tiene un pago registrado después de la fecha de expiración
   */
  private async hasUpcomingPayment(
    gymId: string,
    clientId: string,
    planId: string,
    expiryDate: string,
  ): Promise<boolean> {
    const payment = await this.paymentsRepo
      .createQueryBuilder('payment')
      .innerJoin('payment_items', 'item', 'item.payment_id = payment.id')
      .where('payment.gym_id = :gymId', { gymId })
      .andWhere('item.client_id = :clientId', { clientId })
      .andWhere('item.plan_id = :planId', { planId })
      .andWhere('payment.paid_at >= :expiryDate', { expiryDate })
      .getOne();

    return !!payment;
  }

  /**
   * Método manual para probar el envío de recordatorios
   */
  async sendTestReminder(membershipId: string) {
    const membership = await this.membershipsRepo.findOne({
      where: { id: membershipId },
    });

    if (!membership) {
      throw new Error('Membresía no encontrada');
    }

    // Obtener plan
    const plan = await this.plansRepo.findOne({
      where: { id: membership.planId },
    });

    if (!plan) {
      throw new Error('Plan no encontrado');
    }

    // Obtener gym_user
    const gymUser = await this.gymUsersRepo.findOne({
      where: { id: membership.clientGymUserId },
    });

    if (!gymUser) {
      throw new Error('GymUser no encontrado');
    }

    const user = await this.usersRepo.findOne({
      where: { id: gymUser.userId },
    });

    if (!user || !user.email) {
      throw new Error('Usuario no encontrado o sin email');
    }

    const today = new Date();
    const expiryDate = new Date(membership.endsOn);
    const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    await this.commsService.sendExpirationReminder(
      membership.gymId,
      user.id,
      user.email,
      user.fullName,
      plan.name,
      membership.endsOn,
      daysUntilExpiry,
    );

    return { message: 'Recordatorio de prueba enviado exitosamente' };
  }
}
