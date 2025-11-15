import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
} from 'typeorm';

export enum CampaignStatusEnum {
  DRAFT = 'DRAFT',
  SCHEDULED = 'SCHEDULED',
  SENT = 'SENT',
  CANCELLED = 'CANCELLED',
}

@Entity({ name: 'campaigns' })
export class EmailCampaign {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid', { name: 'gym_id' })
  gymId!: string;

  @Column('uuid', { name: 'template_id', nullable: true })
  templateId?: string;

  @Column('text')
  subject!: string;

  @Column('text', { name: 'body_html', nullable: true })
  html?: string;

  @Column('text', { name: 'body_text', nullable: true })
  bodyText?: string;

  @Column('jsonb', { nullable: true })
  filters?: any;

  @Column('timestamptz', { name: 'scheduled_at', nullable: true })
  scheduledAt?: Date;

  @Column('text', { default: 'DRAFT' })
  status!: string;

  @Column('uuid', { name: 'created_by', nullable: true })
  createdBy?: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
