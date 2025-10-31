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

  @ManyToOne(() => Payment, (p) => p.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'payment_id' })
  payment!: Payment;

  @Column('uuid', { name: 'client_id' })
  clientId!: string;

  @Column('uuid', { name: 'plan_id' })
  planId!: string;

  @Column('int', { default: 1 })
  quantity!: number;

  @Column('int', { name: 'unit_price_clp' })
  unitPriceClp!: number;

  // descuento % aplicado a este ítem (0-100). Para UI actual puede ir en 0.
  @Column('int', { name: 'discount_percent', default: 0 })
  discountPercent!: number;

  // total final del ítem (con descuento)
  @Column('int', { name: 'total_clp' })
  totalClp!: number;
}
