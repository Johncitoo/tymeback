import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Unique,
  Index,
  OneToMany,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { WorkoutEntry } from './workout-entry.entity';
import { RoutineAssignment } from '../../routines/entities/routine-assignment.entity';

@Entity({ name: 'workout_sessions' })
@Unique('u_session_week_day', ['gymId', 'assignmentId', 'weekStart', 'dayIndex'])
@Index(['gymId', 'clientId', 'weekStart', 'dayIndex'])
export class WorkoutSession {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid', { name: 'gym_id' })
  gymId!: string;

  @Column('uuid', { name: 'assignment_id' })
  assignmentId!: string;

  @ManyToOne(() => RoutineAssignment, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'assignment_id' })
  assignment!: RoutineAssignment;

  @Column('uuid', { name: 'client_id' })
  clientId!: string;

  /**
   * Fecha del domingo que inicia la semana (zona America/Santiago) en formato YYYY-MM-DD
   */
  @Column('date', { name: 'week_start' })
  weekStart!: string;

  /** 1..7 */
  @Column('int', { name: 'day_index' })
  dayIndex!: number;

  @CreateDateColumn({ type: 'timestamptz', name: 'started_at' })
  startedAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt!: Date;

  @OneToMany(() => WorkoutEntry, (e) => e.session, { cascade: false })
  entries!: WorkoutEntry[];
}
