import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Payment } from './payment.entity';

@Entity({ name: 'payment_items' })
@Index(['paymentId'])
export class PaymentItem {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid', { name: 'payment_id' })
  paymentId!: string;

  // TODO: Restaurar relación cuando Payment.items se reimplemente
  // @ManyToOne(() => Payment, (p) => p.items, { onDelete: 'CASCADE' })
  // @JoinColumn({ name: 'payment_id' })
  // payment!: Payment;

  @Column('uuid', { name: 'client_gym_user_id' })
  clientGymUserId!: string;

  @Column('uuid', { name: 'plan_id' })
  planId!: string;

  @Column('int', { name: 'unit_price_clp' })
  unitPriceClp!: number;

  @Column('int', { name: 'discount_clp', default: 0 })
  discountClp!: number;

  @Column('int', { name: 'final_amount_clp' })
  finalAmountClp!: number;

  @Column('uuid', { name: 'promotion_id', nullable: true })
  promotionId!: string | null;
}
