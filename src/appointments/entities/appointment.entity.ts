import {
  Entity, PrimaryGeneratedColumn, Column, Index, CreateDateColumn, UpdateDateColumn,
} from 'typeorm';

export enum AppointmentStatusEnum {
  BOOKED = 'BOOKED',       // creada
  CONFIRMED = 'CONFIRMED', // reprogramada/confirmada
  COMPLETED = 'COMPLETED', // realizada
  CANCELED = 'CANCELED',   // cancelada
  NO_SHOW = 'NO_SHOW',     // inasistencia
}

export enum AppointmentTypeEnum {
  TRAINING = 'TRAINING',
  NUTRITION = 'NUTRITION',
  OTHER = 'OTHER',
}

@Entity({ name: 'appointments' })
@Index(['gymId', 'staffId', 'startAt'])
@Index(['gymId', 'clientId', 'startAt'])
export class Appointment {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid', { name: 'gym_id' })
  gymId!: string;

  @Column({ type: 'enum', enum: AppointmentTypeEnum, name: 'type' })
  type!: AppointmentTypeEnum;

  @Column('uuid', { name: 'client_id' })
  clientId!: string;

  @Column('uuid', { name: 'staff_id' })
  staffId!: string;

  @Column('timestamptz', { name: 'start_at' })
  startAt!: Date;

  @Column('timestamptz', { name: 'end_at' })
  endAt!: Date;

  @Column({ type: 'enum', enum: AppointmentStatusEnum, default: AppointmentStatusEnum.BOOKED, name: 'status' })
  status!: AppointmentStatusEnum;

  // si requiere consumir 1 sesión privada
  @Column({ type: 'boolean', name: 'requires_session', default: false })
  requiresSession!: boolean;

  // membresía que se consumirá (opcional)
  @Column('uuid', { name: 'membership_id', nullable: true })
  membershipId!: string | null;

  // auditoría
  @Column('uuid', { name: 'created_by_user_id' })
  createdByUserId!: string;

  @Column('uuid', { name: 'canceled_by_user_id', nullable: true })
  canceledByUserId!: string | null;

  @Column('text', { name: 'cancel_reason', nullable: true })
  cancelReason!: string | null;

  // si fue reprogramada, vínculo a la original
  @Column('uuid', { name: 'rescheduled_from_id', nullable: true })
  rescheduledFromId!: string | null;

  @Column('text', { name: 'notes', nullable: true })
  notes!: string | null;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt!: Date;
}
