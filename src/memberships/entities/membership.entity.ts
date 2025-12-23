// src/memberships/entities/membership.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
  CreateDateColumn,
} from 'typeorm';

export enum MembershipStatusEnum {
  ACTIVE = 'ACTIVE',
  EXPIRED = 'EXPIRED',
  CANCELED = 'CANCELED',
}

@Entity({ name: 'memberships' })
@Index(['clientGymUserId'])
export class Membership {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid', { name: 'gym_id' })
  gymId!: string;

  // CLIENT gym_user id (not direct user id)
  @Column('uuid', { name: 'client_gym_user_id' })
  clientGymUserId!: string;

  @Column('uuid', { name: 'plan_id' })
  planId!: string;

  @Column('uuid', { name: 'payment_item_id' })
  paymentItemId!: string;

  // Vigencia (ends_on INCLUSIVA)
  @Column('date', { name: 'starts_on' })
  startsOn!: string;

  @Column('date', { name: 'ends_on' })
  endsOn!: string;

  // Sesiones privadas por período
  @Column('int', { name: 'sessions_quota', default: 0 })
  sessionsQuota!: number;

  @Column('int', { name: 'sessions_used', default: 0 })
  sessionsUsed!: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
  
  // Computed: status basado en fechas (no existe en DB)
  get status(): MembershipStatusEnum {
    const today = new Date().toISOString().slice(0, 10);
    if (this.endsOn < today) return MembershipStatusEnum.EXPIRED;
    if (this.startsOn > today) return MembershipStatusEnum.CANCELED; // o podrías usar PENDING
    return MembershipStatusEnum.ACTIVE;
  }
}
