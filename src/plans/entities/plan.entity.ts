// src/plans/entities/plan.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  Index,
} from 'typeorm';

@Entity({ name: 'plans' })
@Index(['gymId', 'name'], { unique: true })
export class Plan {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid', { name: 'gym_id' })
  gymId!: string;

  @Column('text')
  name!: string;

  @Column('text', { nullable: true })
  description!: string | null;

  // Duración exclusiva: meses XOR días (se valida en servicio)
  @Column('int', { name: 'duration_months', nullable: true })
  durationMonths!: number | null;

  @Column('int', { name: 'duration_days', nullable: true })
  durationDays!: number | null;

  // Precio CLP con IVA incluido
  @Column('int', { name: 'price_clp' })
  priceClp!: number;

  // Sesiones privadas por período de membresía (0 = no incluye)
  @Column('int', { name: 'private_sessions_per_period', default: 0 })
  privateSessionsPerPeriod!: number;

  @Column('boolean', { name: 'is_active', default: true })
  isActive!: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamptz' })
  deletedAt!: Date | null;
}
