import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Payment } from './entities/payment.entity';
import { PaymentItem } from './entities/payment-item.entity';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { User } from '../users/entities/user.entity';
import { Plan } from '../plans/entities/plan.entity';
import { MembershipsModule } from '../memberships/memberships.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Payment, PaymentItem, User, Plan]),
    MembershipsModule, // para crear membresías tras pagar
  ],
  providers: [PaymentsService],
  controllers: [PaymentsController],
})
export class PaymentsModule {}
