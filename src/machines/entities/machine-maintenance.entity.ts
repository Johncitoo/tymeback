import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Machine } from './machine.entity';

@Entity({ name: 'machine_maintenance' })
@Index(['gymId', 'machineId', 'performedAt'])
export class MachineMaintenance {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid', { name: 'gym_id' })
  gymId!: string;

  @Column('uuid', { name: 'machine_id' })
  machineId!: string;

  @ManyToOne(() => Machine, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'machine_id' })
  machine!: Machine;

  @Column('timestamptz', { name: 'performed_at' })
  performedAt!: Date;

  @Column('text', { name: 'description' })
  description!: string;

  @Column('int', { name: 'cost_clp', nullable: true })
  costClp!: number | null;

  @Column('uuid', { name: 'performed_by_user_id', nullable: true })
  performedByUserId!: string | null;

  @Column('timestamptz', { name: 'next_due_at', nullable: true })
  nextDueAt!: Date | null;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date;
}
