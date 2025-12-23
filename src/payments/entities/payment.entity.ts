import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Index,
} from 'typeorm';

export enum PaymentMethodEnum {
  CASH = 'CASH',
  TRANSFER = 'TRANSFER',
  DEBIT = 'DEBIT',
  CREDIT = 'CREDIT',
  OTHER = 'OTHER',
}

@Entity({ name: 'payments' })
@Index(['gymId', 'paidAt'])
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid', { name: 'gym_id' })
  gymId!: string;

  @Column('int', { name: 'total_amount_clp' })
  totalAmountClp!: number;

  @Column('timestamptz', { name: 'paid_at' })
  paidAt!: Date;

  @Column({
    type: 'enum',
    enum: PaymentMethodEnum,
    enumName: 'payment_method_enum',
    default: PaymentMethodEnum.CASH,
  })
  method!: PaymentMethodEnum;

  @Column('text', { nullable: true })
  notes!: string | null;

  @Column('text', { name: 'receipt_url', nullable: true })
  receiptUrl!: string | null;

  @Column('uuid', { name: 'receipt_file_id', nullable: true })
  receiptFileId!: string | null;

  @Column('uuid', { name: 'processed_by_user_id', nullable: true })
  processedByUserId!: string | null;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date;

  @DeleteDateColumn({ type: 'timestamptz', name: 'deleted_at', nullable: true })
  deletedAt!: Date | null;
}
