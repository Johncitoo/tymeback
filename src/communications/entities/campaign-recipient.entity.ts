import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index,
} from 'typeorm';

export enum RecipientStatusEnum {
  PENDING = 'PENDING',
  SENT = 'SENT',
  FAILED = 'FAILED',
}

@Entity({ name: 'campaign_recipients' })
@Index(['campaignId', 'status'])
export class CampaignRecipient {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid', { name: 'campaign_id' })
  campaignId!: string;

  @Column('uuid', { name: 'gym_id' })
  gymId!: string;

  @Column('uuid', { name: 'client_id', nullable: true })
  clientId!: string | null;

  @Column('text', { name: 'to_email' })
  toEmail!: string;

  @Column({ type: 'enum', enum: RecipientStatusEnum, enumName: 'recipient_status_enum', default: RecipientStatusEnum.PENDING })
  status!: RecipientStatusEnum;

  @Column('timestamptz', { name: 'sent_at', nullable: true })
  sentAt!: Date | null;

  @Column('text', { name: 'error', nullable: true })
  error!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
