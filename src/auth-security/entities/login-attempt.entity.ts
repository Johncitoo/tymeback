import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn, Unique } from 'typeorm';

@Entity('login_attempts')
@Unique('uq_login_attempts_user', ['gymId', 'userId'])
export class LoginAttempt {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid', { name: 'gym_id' })
  @Index()
  gymId!: string;

  @Column('uuid', { name: 'user_id' })
  @Index()
  userId!: string;

  @Column('int', { name: 'fail_count', default: 0 })
  failCount!: number;

  @Column('timestamptz', { name: 'first_failed_at', nullable: true })
  firstFailedAt!: Date | null;

  @Column('timestamptz', { name: 'last_failed_at', nullable: true })
  lastFailedAt!: Date | null;

  @Column('timestamptz', { name: 'locked_until', nullable: true })
  lockedUntil!: Date | null;

  @Column('text', { name: 'last_ip', nullable: true })
  lastIp!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
