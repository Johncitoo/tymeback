import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { RoutineDay } from './routine-day.entity';
import { RoutineAssignment } from './routine-assignment.entity';

@Entity({ name: 'routines' })
@Index(['gymId', 'name'])
export class Routine {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid', { name: 'gym_id' })
  gymId!: string;

  @Column('text')
  name!: string;

  @Column('text', { nullable: true })
  description!: string | null;

  @Column('uuid', { name: 'created_by_user_id', nullable: true })
  createdByUserId!: string | null;

  @Column('boolean', { name: 'is_active', default: true })
  isActive!: boolean;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt!: Date;

  @DeleteDateColumn({ type: 'timestamptz', name: 'deleted_at', nullable: true })
  deletedAt!: Date | null;

  @OneToMany(() => RoutineDay, (d) => d.routine, { cascade: false })
  days!: RoutineDay[];

  @OneToMany(() => RoutineAssignment, (a) => a.routine, { cascade: false })
  assignments!: RoutineAssignment[];
}
