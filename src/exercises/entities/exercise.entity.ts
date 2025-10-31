import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Machine, MuscleGroupEnum } from '../../machines/entities/machine.entity';

export enum ExerciseTypeEnum {
  STRENGTH = 'STRENGTH',
  CARDIO = 'CARDIO',
  FUNCTIONAL = 'FUNCTIONAL',
  MOBILITY = 'MOBILITY',
  OTHER = 'OTHER',
}

export enum DifficultyEnum {
  BEGINNER = 'BEGINNER',
  INTERMEDIATE = 'INTERMEDIATE',
  ADVANCED = 'ADVANCED',
}

@Entity({ name: 'exercises' })
@Index(['gymId', 'name'])
export class Exercise {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid', { name: 'gym_id' })
  gymId!: string;

  @Column('text')
  name!: string;

  @Column('enum', { enum: ExerciseTypeEnum, default: ExerciseTypeEnum.STRENGTH })
  type!: ExerciseTypeEnum;

  @Column('enum', { enum: DifficultyEnum, default: DifficultyEnum.BEGINNER })
  difficulty!: DifficultyEnum;

  @Column('enum', { enum: MuscleGroupEnum, name: 'muscle_group', default: MuscleGroupEnum.OTHER })
  muscleGroup!: MuscleGroupEnum;

  @Column('text', { nullable: true })
  description!: string | null;

  @Column('text', { name: 'image_url', nullable: true })
  imageUrl!: string | null;

  @Column('text', { name: 'video_url', nullable: true })
  videoUrl!: string | null;

  @Column('uuid', { name: 'machine_id', nullable: true })
  machineId!: string | null;

  @ManyToOne(() => Machine, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'machine_id' })
  machine?: Machine | null;

  @Column('text', { nullable: true })
  notes!: string | null;

  @Column('boolean', { name: 'is_active', default: true })
  isActive!: boolean;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt!: Date;

  @DeleteDateColumn({ type: 'timestamptz', name: 'deleted_at', nullable: true })
  deletedAt!: Date | null;
}
