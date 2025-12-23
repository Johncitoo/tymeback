// src/gym-users/entities/gym-user.entity.ts
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
import { RoleEnum } from '../../users/entities/user.entity';

@Entity({ name: 'gym_users' })
@Index(['gymId', 'userId'], { unique: true }) // Un usuario solo puede estar una vez por gym
export class GymUser {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column('uuid', { name: 'gym_id' })
  gymId!: string;

  @Index()
  @Column('uuid', { name: 'user_id' })
  userId!: string;

  @Column({
    type: 'enum',
    enum: RoleEnum,
    enumName: 'role_enum',
  })
  role!: RoleEnum;

  @Column('boolean', { name: 'is_active', default: true })
  isActive!: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
