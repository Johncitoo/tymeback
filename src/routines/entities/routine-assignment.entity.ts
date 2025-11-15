import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { Routine } from './routine.entity';

/**
 * Snapshot: Estructura congelada de la rutina al asignarla
 * {
 *   days: [
 *     { dayIndex: 1, name: "Día 1", exercises: [
 *        { rdeId, exerciseId, orderIndex, sets, reps, restSeconds, notes, exercise: { name, imageUrl, ... } }
 *     ]},
 *     ...
 *   ]
 * }
 */
@Entity({ name: 'routine_assignments' })
@Index(['gymId', 'clientId', 'routineId'])
export class RoutineAssignment {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid', { name: 'gym_id' })
  gymId!: string;

  @Column('uuid', { name: 'routine_id' })
  routineId!: string;

  @ManyToOne(() => Routine, (r) => r.assignments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'routine_id' })
  routine!: Routine;

  @Column('uuid', { name: 'client_id' })
  clientId!: string;

  @Column('uuid', { name: 'assigned_by', nullable: true })
  assignedByUserId!: string | null;

  @CreateDateColumn({ type: 'timestamptz', name: 'assigned_at' })
  assignedAt!: Date;

  /** Permite desactivar una asignación sin borrar histórico */
  @Column('boolean', { name: 'is_active', default: true })
  isActive!: boolean;

  /** Overrides por ejercicio del cliente (peso/reps/tipos complejos) */
  @Column('jsonb', { name: 'exercise_overrides', nullable: true })
  exerciseOverrides!: any | null;

  /** Snapshot aislado al momento de asignar */
  @Column('jsonb', { name: 'snapshot', nullable: false, default: () => `'{}'::jsonb` })
  snapshot!: any;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt!: Date;
}
