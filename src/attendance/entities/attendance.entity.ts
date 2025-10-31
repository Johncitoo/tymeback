import {
  Entity, PrimaryGeneratedColumn, Column, Index,
  CreateDateColumn, UpdateDateColumn
} from 'typeorm';

export enum CheckoutReasonEnum {
  USER = 'USER',
  AUTO_TIMEOUT = 'AUTO_TIMEOUT',
  AUTO_CLOSING_TIME = 'AUTO_CLOSING_TIME',
}

@Entity({ name: 'attendance' })
@Index(['gymId', 'clientId', 'checkInAt'])
export class Attendance {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid', { name: 'gym_id' })
  gymId!: string;

  @Column('uuid', { name: 'client_id' })
  clientId!: string;

  @Column('timestamptz', { name: 'check_in_at' })
  checkInAt!: Date;

  @Column('timestamptz', { name: 'check_out_at', nullable: true })
  checkOutAt!: Date | null;

  // Mapea ENUM de la base: checkout_reason_enum
  @Column({
    type: 'enum',
    enum: CheckoutReasonEnum,
    enumName: 'checkout_reason_enum',
    name: 'checkout_reason',
    nullable: true,
  })
  checkoutReason!: CheckoutReasonEnum | null;

  @Column('text', { nullable: true })
  note!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
