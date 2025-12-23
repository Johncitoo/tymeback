import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InbodyScansService } from './inbody-scans.service';
import { InbodyScansController } from './inbody-scans.controller';
import { InbodyScan } from './entities/inbody-scan.entity';
import { User } from '../users/entities/user.entity';
import { GymUser } from '../gym-users/entities/gym-user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([InbodyScan, User, GymUser])],
  controllers: [InbodyScansController],
  providers: [InbodyScansService],
  exports: [TypeOrmModule, InbodyScansService],
})
export class InbodyScansModule {}
