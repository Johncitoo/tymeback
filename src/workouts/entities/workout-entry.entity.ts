import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { WorkoutSession } from './workout-session.entity';

@Entity({ name: 'workout_entries' })
@Index(['gymId', 'sessionId'])
@Index(['gymId', 'rdeId'])
export class WorkoutEntry {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid', { name: 'gym_id' })
  gymId!: string;

  @Column('uuid', { name: 'session_id' })
  sessionId!: string;

  @ManyToOne(() => WorkoutSession, (s) => s.entries, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'session_id' })
  session!: WorkoutSession;

  /**
   * ID del routine_day_exercise al que corresponde esta entrada
   */
  @Column('uuid', { name: 'rde_id' })
  rdeId!: string;

  /**
   * Estado "hecho" para este ejercicio en esta sesión
   */
  @Column('boolean', { name: 'done', default: false })
  done!: boolean;

  @Column('timestamptz', { name: 'completed_at', nullable: true })
  completedAt!: Date | null;

  /**
   * Campo libre por si guardas reps/pesos reales, tiempos, notas, etc.
   * (El front actual solo requiere "done"; lo dejamos preparado.)
   */
  @Column('jsonb', { name: 'actual', nullable: true })
  actual!: Record<string, any> | null;

  @Column('text', { name: 'notes', nullable: true })
  notes!: string | null;
}
