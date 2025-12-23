// src/clients/clients.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientsService } from './clients.service';
import { ClientsController } from './clients.controller';
import { Client } from './entities/client.entity';
import { EmergencyContact } from './entities/emergency-contact.entity';
import { GymUser } from '../gym-users/entities/gym-user.entity';
import { UsersModule } from '../users/users.module';
import { User } from '../users/entities/user.entity';
import { TrashCleanupService } from '../common/trash-cleanup.service';

@Module({
  imports: [TypeOrmModule.forFeature([Client, EmergencyContact, User, GymUser]), UsersModule],
  controllers: [ClientsController],
  providers: [ClientsService, TrashCleanupService],
  exports: [ClientsService, TypeOrmModule],
})
export class ClientsModule {}
