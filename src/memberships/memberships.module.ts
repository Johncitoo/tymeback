import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Membership } from './entities/membership.entity';
import { Plan } from '../plans/entities/plan.entity';
import { User } from '../users/entities/user.entity';
import { Payment } from '../payments/entities/payment.entity';
import { GymUser } from '../gym-users/entities/gym-user.entity';
import { MembershipsService } from './memberships.service';
import { MembershipsController } from './memberships.controller';
import { MembershipRemindersService } from './membership-reminders.service';
import { CommunicationsModule } from '../communications/communications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Membership, Plan, User, Payment, GymUser]),
    CommunicationsModule,
  ],
  providers: [MembershipsService, MembershipRemindersService],
  controllers: [MembershipsController],
  exports: [TypeOrmModule, MembershipsService],
})
export class MembershipsModule {}
