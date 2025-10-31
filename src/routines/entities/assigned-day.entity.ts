// src/routines/entities/assigned-day.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
} from 'typeorm';

@Entity({ name: 'assigned_days' })
@Index(['assignmentId', 'dayIndex'], { unique: true })
export class AssignedDay {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid', { name: 'assignment_id' })
  assignmentId!: string;

  @Column('int', { name: 'day_index' })
  dayIndex!: number;

  @Column('text', { nullable: true })
  name!: string | null;
}
