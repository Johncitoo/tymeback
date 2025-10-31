// src/workouts/entities/workout-completion.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
  CreateDateColumn,
} from 'typeorm';

@Entity({ name: 'workout_completions' })
@Index(['gymId', 'clientId', 'assignmentId', 'assignedExerciseId', 'weekStart'], { unique: true })
export class WorkoutCompletion {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid', { name: 'gym_id' })
  gymId!: string;

  @Column('uuid', { name: 'client_id' })
  clientId!: string;

  @Column('uuid', { name: 'assignment_id' })
  assignmentId!: string;

  @Column('uuid', { name: 'assigned_day_id' })
  assignedDayId!: string;

  @Column('uuid', { name: 'assigned_exercise_id' })
  assignedExerciseId!: string;

  // Domingo (inicio de semana). Al cambiar de semana, no hay filas => UI ve todo "no hecho"
  @Column('date', { name: 'week_start' })
  weekStart!: string;

  @CreateDateColumn({ name: 'completed_at', type: 'timestamptz' })
  completedAt!: Date;

  @Column('text', { nullable: true })
  note!: string | null;
}
