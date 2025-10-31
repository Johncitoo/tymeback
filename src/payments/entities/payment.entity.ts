import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { PaymentItem } from './payment-item.entity';

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

  @Column('uuid', { name: 'client_id' })
  clientId!: string;

  // El plan elegido en este pago (UI actual asume un plan por pago)
  @Column('uuid', { name: 'plan_id' })
  planId!: string;

  @Column('enum', { enum: PaymentMethodEnum, default: PaymentMethodEnum.CASH, name: 'method' })
  method!: PaymentMethodEnum;

  @Column('timestamptz', { name: 'paid_at' })
  paidAt!: Date;

  @Column('int', { name: 'total_amount_clp' })
  totalAmountClp!: number;

  @Column('int', { name: 'net_amount_clp' })
  netAmountClp!: number;

  @Column('int', { name: 'vat_amount_clp' })
  vatAmountClp!: number;

  // audit: quién creó el pago (ADMIN)
  @Column('uuid', { name: 'created_by_user_id' })
  createdByUserId!: string;

  // backdating: si el paidAt fue seteado en el pasado, motivo obligatorio
  @Column('text', { name: 'backdating_reason', nullable: true })
  backdatingReason!: string | null;

  // comprobante opcional (files.id)
  @Column('uuid', { name: 'receipt_file_id', nullable: true })
  receiptFileId!: string | null;

  // notas internas
  @Column('text', { nullable: true })
  note!: string | null;

  @OneToMany(() => PaymentItem, (it) => it.payment, { cascade: ['insert'], eager: true })
  items!: PaymentItem[];

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt!: Date;

  @DeleteDateColumn({ type: 'timestamptz', name: 'deleted_at', nullable: true })
  deletedAt!: Date | null;
}
