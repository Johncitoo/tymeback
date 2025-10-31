import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity({ name: 'session_qr_tokens' })
@Index(['gymId', 'clientId', 'expiresAt'])
@Index(['gymId', 'membershipId'])
@Index(['token'], { unique: true })
export class SessionQrToken {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid', { name: 'gym_id' })
  gymId!: string;

  @Column('uuid', { name: 'membership_id' })
  membershipId!: string;

  @Column('uuid', { name: 'client_id' })
  clientId!: string;

  @Column('uuid', { name: 'created_by_user_id' })
  createdByUserId!: string;

  @Column('text')
  token!: string; // base64url

  @Column('timestamptz', { name: 'expires_at' })
  expiresAt!: Date;

  @Column('timestamptz', { name: 'used_at', nullable: true })
  usedAt!: Date | null;

  @Column('uuid', { name: 'used_by_client_id', nullable: true })
  usedByClientId!: string | null;

  @Column('boolean', { default: false })
  revoked!: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
