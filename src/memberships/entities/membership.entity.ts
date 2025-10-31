// src/memberships/entities/membership.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';

export enum MembershipStatusEnum {
  ACTIVE = 'ACTIVE',
  EXPIRED = 'EXPIRED',
  CANCELED = 'CANCELED',
}

@Entity({ name: 'memberships' })
@Index(['gymId', 'clientId', 'status'])
@Index(['gymId', 'clientId', 'startDate', 'endDate'])
export class Membership {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid', { name: 'gym_id' })
  gymId!: string;

  // CLIENT user id
  @Column('uuid', { name: 'client_id' })
  clientId!: string;

  @Column('uuid', { name: 'plan_id' })
  planId!: string;

  // Vigencia (endDate INCLUSIVA)
  @Column('date', { name: 'start_date' })
  startDate!: string;

  @Column('date', { name: 'end_date' })
  endDate!: string;

  @Column({
    type: 'enum',
    enum: MembershipStatusEnum,
    enumName: 'membership_status_enum',
    default: MembershipStatusEnum.ACTIVE,
  })
  status!: MembershipStatusEnum;

  // Sesiones privadas por período
  @Column('int', { name: 'sessions_quota', default: 0 })
  sessionsQuota!: number;

  @Column('int', { name: 'sessions_used', default: 0 })
  sessionsUsed!: number;

  @Column('text', { nullable: true })
  note!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamptz' })
  deletedAt!: Date | null;
}

// 👉 Alias para compatibilidad con imports existentes:
export { MembershipStatusEnum as MembershipStatus };
