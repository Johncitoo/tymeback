import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum BurnMethodEnum {
  QR = 'QR',
  MANUAL = 'MANUAL',
}

@Entity({ name: 'session_burns' })
@Index(['gymId', 'clientId', 'burnedAt'])
export class SessionBurn {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid', { name: 'gym_id' })
  gymId!: string;

  @Column('uuid', { name: 'membership_id' })
  membershipId!: string;

  @Column('uuid', { name: 'client_id' })
  clientId!: string;

  @Column({ type: 'enum', enum: BurnMethodEnum, enumName: 'burn_method_enum' })
  method!: BurnMethodEnum;

  // Si fue manual: user (ADMIN/TRAINER) que quemó; si fue QR: null
  @Column('uuid', { name: 'burned_by_user_id', nullable: true })
  burnedByUserId!: string | null;

  // Si fue QR: cliente que lo redimió; manual: null
  @Column('uuid', { name: 'redeemed_by_client_id', nullable: true })
  redeemedByClientId!: string | null;

  @Column('timestamptz', { name: 'burned_at', default: () => 'NOW()' })
  burnedAt!: Date;

  @Column('text', { nullable: true })
  note!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
