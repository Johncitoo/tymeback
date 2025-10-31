import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
  Unique,
} from 'typeorm';
import { Routine } from './routine.entity';
import { RoutineDayExercise } from './routine-day-exercise.entity';

@Entity({ name: 'routine_days' })
@Unique('u_routine_dayindex', ['routineId', 'dayIndex'])
export class RoutineDay {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid', { name: 'gym_id' })
  gymId!: string;

  @Column('uuid', { name: 'routine_id' })
  routineId!: string;

  @ManyToOne(() => Routine, (r) => r.days, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'routine_id' })
  routine!: Routine;

  /** 1..7 */
  @Column('int', { name: 'day_index' })
  dayIndex!: number;

  /** opcional, por si quieres poner "Pecho" o similar */
  @Column('text', { nullable: true })
  name!: string | null;

  @OneToMany(() => RoutineDayExercise, (e) => e.day, { cascade: false })
  exercises!: RoutineDayExercise[];
}
