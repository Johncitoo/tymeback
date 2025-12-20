import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { GymUser } from '../gym-users/entities/gym-user.entity';
import { Client } from '../clients/entities/client.entity';

@Injectable()
export class TrashCleanupService {
  private readonly logger = new Logger(TrashCleanupService.name);

  constructor(
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
    @InjectRepository(GymUser)
    private readonly gymUsersRepo: Repository<GymUser>,
    @InjectRepository(Client)
    private readonly clientsRepo: Repository<Client>,
  ) {}

  /**
   * Ejecuta diariamente a las 3 AM
   * Elimina permanentemente registros con deleted_at > 30 días
   */
  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async cleanupTrash() {
    this.logger.log('🗑️ Iniciando limpieza automática del basurero...');

    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      // Buscar usuarios eliminados hace más de 30 días
      const deletedUsers = await this.usersRepo.find({
        where: {
          deletedAt: LessThan(thirtyDaysAgo),
        },
        withDeleted: true,
      });

      let deletedCount = 0;

      for (const user of deletedUsers) {
        try {
          // Buscar gym_users asociados
          const gymUsers = await this.gymUsersRepo.find({
            where: { userId: user.id },
            withDeleted: true,
          });

          // Eliminar clients asociados
          for (const gymUser of gymUsers) {
            await this.clientsRepo.delete({ gymUserId: gymUser.id });
            await this.gymUsersRepo.delete(gymUser.id);
          }

          // Eliminar usuario permanentemente
          await this.usersRepo.delete(user.id);
          deletedCount++;

          this.logger.log(`✅ Usuario ${user.email} eliminado permanentemente`);
        } catch (error) {
          this.logger.error(`❌ Error eliminando usuario ${user.id}:`, error);
        }
      }

      this.logger.log(`🎉 Limpieza completada: ${deletedCount} usuarios eliminados permanentemente`);
    } catch (error) {
      this.logger.error('❌ Error en limpieza automática del basurero:', error);
    }
  }

  /**
   * Método manual para limpiar (puede ser llamado desde un endpoint admin)
   */
  async cleanupNow() {
    this.logger.log('🔧 Limpieza manual iniciada');
    await this.cleanupTrash();
    return { message: 'Limpieza completada' };
  }
}
