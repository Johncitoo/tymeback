import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { RoutineDay } from './routine-day.entity';
import { Routine } from './routine.entity';
import { Exercise } from '../../exercises/entities/exercise.entity';

export enum SetTypeEnum {
  NORMAL = 'NORMAL',
  DROP_SET = 'DROP_SET',
  SUPERSET = 'SUPERSET',
  PYRAMID = 'PYRAMID',
  REST_PAUSE = 'REST_PAUSE',
}

@Entity({ name: 'routine_day_exercises' })
@Index(['gymId', 'routineId', 'dayId', 'orderIndex'])
export class RoutineDayExercise {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid', { name: 'gym_id' })
  gymId!: string;

  @Column('uuid', { name: 'routine_id' })
  routineId!: string;

  @ManyToOne(() => Routine, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'routine_id' })
  routine!: Routine;

  @Column('uuid', { name: 'routine_day_id' })
  dayId!: string;

  @ManyToOne(() => RoutineDay, (d) => d.exercises, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'routine_day_id' })
  day!: RoutineDay;

  @Column('uuid', { name: 'exercise_id' })
  exerciseId!: string;

  @ManyToOne(() => Exercise, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'exercise_id' })
  exercise!: Exercise;

  /** Orden dentro del día (0..N) */
  @Column('int', { name: 'order_index', default: 0 })
  orderIndex!: number;

  /** Base de plantilla (el cliente puede tener overrides) */
  @Column('int', { name: 'sets', default: 3 })
  sets!: number;

  @Column('int', { name: 'reps', default: 10 })
  reps!: number;

  @Column('int', { name: 'rest_seconds', default: 60 })
  restSeconds!: number;

  @Column('text', { nullable: true })
  notes!: string | null;
}
