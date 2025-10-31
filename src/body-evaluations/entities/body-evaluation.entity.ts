import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
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

  // nutricionista que registra (o admin)
  @Column('uuid', { name: 'nutritionist_id', nullable: true })
  nutritionistId!: string | null;

  @Column('timestamptz', { name: 'measured_at', default: () => 'NOW()' })
  measuredAt!: Date;

  // datos libres: %grasa, kg músculo, TMB, perímetros (cintura, cadera, cuello), etc.
  @Column('jsonb', { name: 'data' })
  data!: Record<string, any>;

  @Column('text', { name: 'notes', nullable: true })
  notes!: string | null;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt!: Date;
}
