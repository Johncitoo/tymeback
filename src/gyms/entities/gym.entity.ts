// src/gyms/entities/gym.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity({ name: 'gyms' })
export class Gym {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'text' })
  name!: string;

  @Index({ unique: true })
  @Column({ type: 'text', unique: true })
  slug!: string; // NOT NULL en el schema

  @Column({ type: 'boolean', name: 'is_active', default: true })
  isActive!: boolean;

  @Column({ type: 'text', default: 'America/Santiago' })
  timezone!: string;

  @Column({ type: 'text', default: 'CLP' })
  currency!: string;

  @Column({ type: 'text', name: 'logo_url', nullable: true })
  logoUrl!: string | null;

  @Column({ type: 'text', name: 'primary_color', default: '#3B82F6' })
  primaryColor!: string;

  @Column({ type: 'jsonb', default: {} })
  settings!: Record<string, any>;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
