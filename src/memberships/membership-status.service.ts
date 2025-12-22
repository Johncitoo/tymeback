import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { Membership } from '../memberships/entities/membership.entity';
import { User } from '../users/entities/user.entity';
import { GymUser } from '../gym-users/entities/gym-user.entity';

/**
 * Servicio para gestionar el estado activo/inactivo de usuarios según sus membresías
 */
@Injectable()
export class MembershipStatusService {
  constructor(
    @InjectRepository(Membership)
    private readonly membershipsRepo: Repository<Membership>,
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
    @InjectRepository(GymUser)
    private readonly gymUsersRepo: Repository<GymUser>,
  ) {}

  /**
   * Cron job que se ejecuta diariamente a medianoche
   * Marca como inactivos a los usuarios cuya membresía expiró
   */
  @Cron('0 0 * * *') // Todos los días a las 00:00
  async updateExpiredMemberships() {
    console.log('[MembershipStatus] Iniciando actualización de membresías expiradas...');

    const today = new Date().toISOString().slice(0, 10);

    // Buscar membresías que ya expiraron
    const expiredMemberships = await this.membershipsRepo
      .createQueryBuilder('m')
      .where('m.ends_on < :today', { today })
      .getMany();

    console.log(`[MembershipStatus] Encontradas ${expiredMemberships.length} membresías expiradas`);

    for (const membership of expiredMemberships) {
      try {
        // Obtener el gym_user asociado
        const gymUser = await this.gymUsersRepo.findOne({
          where: { id: membership.clientGymUserId },
        });

        if (!gymUser) continue;

        // Verificar si hay otras membresías activas para este cliente
        const activeMemberships = await this.membershipsRepo
          .createQueryBuilder('m')
          .where('m.client_gym_user_id = :gymUserId', { gymUserId: gymUser.id })
          .andWhere('m.ends_on >= :today', { today })
          .getCount();

        // Si no tiene membresías activas, marcar usuario como inactivo
        if (activeMemberships === 0) {
          await this.usersRepo.update(
            { id: gymUser.userId },
            { isActive: false }
          );

          console.log(`[MembershipStatus] Usuario ${gymUser.userId} marcado como inactivo`);
        }
      } catch (error) {
        console.error(`[MembershipStatus] Error procesando membresía ${membership.id}:`, error);
      }
    }

    console.log('[MembershipStatus] Proceso completado');
  }

  /**
   * Verificar y actualizar el estado de un usuario específico
   */
  async checkUserStatus(userId: string): Promise<boolean> {
    // Obtener todas las gym_users de este usuario
    const gymUsers = await this.gymUsersRepo.find({
      where: { userId },
    });

    if (gymUsers.length === 0) {
      return false;
    }

    const today = new Date().toISOString().slice(0, 10);
    let hasActiveMembership = false;

    // Verificar si tiene al menos una membresía activa en algún gym
    for (const gymUser of gymUsers) {
      const activeMemberships = await this.membershipsRepo
        .createQueryBuilder('m')
        .where('m.client_gym_user_id = :gymUserId', { gymUserId: gymUser.id })
        .andWhere('m.ends_on >= :today', { today })
        .getCount();

      if (activeMemberships > 0) {
        hasActiveMembership = true;
        break;
      }
    }

    // Actualizar estado del usuario
    await this.usersRepo.update(
      { id: userId },
      { isActive: hasActiveMembership }
    );

    return hasActiveMembership;
  }

  /**
   * Activar usuario cuando se registra un pago
   */
  async activateUserOnPayment(userId: string): Promise<void> {
    await this.usersRepo.update(
      { id: userId },
      { isActive: true }
    );
    console.log(`[MembershipStatus] Usuario ${userId} activado por pago`);
  }
}
