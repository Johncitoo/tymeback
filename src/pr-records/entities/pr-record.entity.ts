import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Exercise } from '../../exercises/entities/exercise.entity';

const decimalToNumber = {
  to: (v?: number | null) => v,
  from: (v?: string | null) => (v == null ? null : Number(v)),
};

@Entity({ name: 'pr_records' })
@Index(['gymId', 'clientId', 'exerciseId', 'recordedAt'])
export class PrRecord {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid', { name: 'gym_id' })
  gymId!: string;

  @Column('uuid', { name: 'client_id' })
  clientId!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'client_id' })
  client!: User;

  @Column('uuid', { name: 'exercise_id' })
  exerciseId!: string;

  @ManyToOne(() => Exercise, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'exercise_id' })
  exercise!: Exercise;

  @Column('timestamptz', { name: 'recorded_at', default: () => 'NOW()' })
  recordedAt!: Date;

  @Column('decimal', {
    name: 'weight_kg',
    precision: 7,
    scale: 2,
    transformer: decimalToNumber,
  })
  weightKg!: number;

  @Column('int', { name: 'reps' })
  reps!: number;

  @Column('uuid', { name: 'created_by_user_id', nullable: true })
  createdByUserId!: string | null;

  @ManyToOne(() => User, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'created_by_user_id' })
  createdByUser!: User | null;

  @Column('text', { name: 'notes', nullable: true })
  notes!: string | null;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt!: Date;
}
