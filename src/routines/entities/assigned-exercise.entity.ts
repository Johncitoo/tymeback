// src/routines/entities/assigned-exercise.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
} from 'typeorm';
import { SetTypeEnum } from './routine-day-exercise.entity';

@Entity({ name: 'assigned_exercises' })
@Index(['assignedDayId', 'orderIndex'])
export class AssignedExercise {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid', { name: 'assigned_day_id' })
  assignedDayId!: string;

  @Column('uuid', { name: 'exercise_id' })
  exerciseId!: string;

  // Copia de los valores base al momento de asignar (para independencia)
  @Column({
    type: 'enum',
    enum: SetTypeEnum,
    enumName: 'set_type_enum',
    default: SetTypeEnum.NORMAL,
  })
  setType!: SetTypeEnum;

  @Column('int', { name: 'sets', default: 3 })
  sets!: number;

  @Column('int', { name: 'reps', default: 10 })
  reps!: number;

  @Column('int', { name: 'rest_seconds', default: 60 })
  restSeconds!: number;

  // Prescription específica del cliente (kg/reps por set, dropset parts, etc.)
  // Estructura flexible, ejemplo:
  // { type:'DROPSET', parts:[{kg:80,reps:8},{kg:70,reps:10}], notes:'...' }
  @Column('jsonb', { name: 'prescription', nullable: true })
  prescription!: any | null;

  @Column('text', { nullable: true })
  notes!: string | null;

  @Column('int', { name: 'order_index', default: 0 })
  orderIndex!: number;
}
