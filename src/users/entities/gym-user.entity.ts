// src/users/entities/gym-user.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { RoleEnum } from './user.entity';

@Entity({ name: 'gym_users' })
export class GymUser {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column('uuid', { name: 'gym_id' })
  gymId!: string;

  @Index()
  @Column('uuid', { name: 'user_id' })
  userId!: string;

  @Index()
  @Column({
    type: 'enum',
    enum: RoleEnum,
    enumName: 'role_enum',
  })
  role!: RoleEnum;

  @Column('boolean', { name: 'is_active', default: true })
  isActive!: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
