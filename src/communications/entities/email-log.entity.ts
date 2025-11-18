import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index,
} from 'typeorm';

export enum EmailLogStatusEnum {
  SENT = 'SENT',
  FAILED = 'FAILED',
  PENDING = 'PENDING',
}

@Entity({ name: 'email_logs' })
@Index(['gymId', 'createdAt'])
export class EmailLog {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid', { name: 'gym_id' })
  gymId!: string;

  @Column('text', { name: 'to_email' })
  toEmail!: string;

  @Column('text')
  subject!: string;

  @Column('uuid', { name: 'template_id', nullable: true })
  templateId!: string | null;

  @Column('uuid', { name: 'campaign_id', nullable: true })
  campaignId!: string | null;

  @Column({ type: 'enum', enum: EmailLogStatusEnum, enumName: 'email_log_status_enum' })
  status!: EmailLogStatusEnum;

  @Column('text', { name: 'provider_message_id', nullable: true })
  providerMessageId!: string | null;

  @Column('text', { nullable: true })
  error!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
