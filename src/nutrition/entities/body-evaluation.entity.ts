import {
  Entity, PrimaryGeneratedColumn, Column, Index,
  CreateDateColumn
} from 'typeorm';

@Entity({ name: 'body_evaluations' })
@Index(['gymId', 'clientId', 'measuredAt'])
export class BodyEvaluation {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid', { name: 'gym_id' })
  gymId!: string;

  @Column('uuid', { name: 'client_id' })
  clientId!: string;

  @Column('uuid', { name: 'nutritionist_id', nullable: true })
  nutritionistId!: string | null;

  @Column({ type: 'timestamptz', name: 'measured_at', default: () => 'now()' })
  measuredAt!: Date;

  // %grasa, masa magra, perímetros, TMB, edad metabólica, etc.
  @Column({ type: 'jsonb' })
  data!: Record<string, any>;

  @Column({ type: 'text', nullable: true })
  notes!: string | null;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date;
}
