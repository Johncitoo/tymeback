import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Membership } from './entities/membership.entity';
import { Plan } from '../plans/entities/plan.entity';
import { User } from '../users/entities/user.entity';
import { MembershipsService } from './memberships.service';
// import { MembershipsController } from './memberships.controller'; // DESHABILITADO

@Module({
  imports: [TypeOrmModule.forFeature([Membership, Plan, User])],
  providers: [MembershipsService],
  controllers: [], // MembershipsController - COMENTADO hasta arreglar gymId issues
  exports: [TypeOrmModule, MembershipsService],
})
export class MembershipsModule {}
