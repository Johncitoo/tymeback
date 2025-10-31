import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InbodyScansService } from './inbody-scans.service';
import { InbodyScansController } from './inbody-scans.controller';
import { InbodyScan } from './entities/inbody-scan.entity';
import { User } from '../users/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([InbodyScan, User])],
  controllers: [InbodyScansController],
  providers: [InbodyScansService],
  exports: [TypeOrmModule, InbodyScansService],
})
export class InbodyScansModule {}
