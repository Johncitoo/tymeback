import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { MachinesService } from './machines.service';
import { MachinesController } from './machines.controller';
import { Machine } from './entities/machine.entity';
import { MachineMaintenance } from './entities/machine-maintenance.entity';
import { User } from '../users/entities/user.entity';
import { MailerModule } from '../communications/mailer/mailer.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Machine, MachineMaintenance, User]),
    ConfigModule,
    MailerModule,
  ],
  controllers: [MachinesController],
  providers: [MachinesService],
  exports: [TypeOrmModule, MachinesService],
})
export class MachinesModule {}
