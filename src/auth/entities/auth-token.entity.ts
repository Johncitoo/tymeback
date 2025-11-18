import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum TokenTypeEnum {
  ACCOUNT_ACTIVATION = 'ACCOUNT_ACTIVATION',
  PASSWORD_RESET = 'PASSWORD_RESET',
  EMAIL_VERIFICATION = 'EMAIL_VERIFICATION',
}

@Entity({ name: 'auth_tokens' })
@Index(['token'], { unique: true })
@Index(['userId', 'type'])
export class AuthToken {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid', { name: 'user_id' })
  userId!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Column('text', { unique: true })
  token!: string;

  @Column({
    type: 'enum',
    enum: TokenTypeEnum,
    enumName: 'token_type_enum',
  })
  type!: TokenTypeEnum;

  @Column('timestamptz', { name: 'expires_at' })
  expiresAt!: Date;

  @Column('boolean', { name: 'is_used', default: false })
  isUsed!: boolean;

  @Column('timestamptz', { name: 'used_at', nullable: true })
  usedAt!: Date | null;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date;
}
