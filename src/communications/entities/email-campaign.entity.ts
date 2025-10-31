import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index,
} from 'typeorm';

export enum CampaignStatusEnum {
  DRAFT = 'DRAFT',
  SCHEDULED = 'SCHEDULED',
  SENDING = 'SENDING',
  SENT = 'SENT',
  CANCELLED = 'CANCELLED',
}

@Entity({ name: 'email_campaigns' })
@Index(['gymId', 'status'])
export class EmailCampaign {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid', { name: 'gym_id' })
  gymId!: string;

  @Column('text')
  name!: string;

  @Column('text')
  subject!: string;

  @Column('text')
  html!: string;

  @Column('jsonb', { nullable: true })
  filters!: any | null; // { activeOnly?: boolean, role?: 'CLIENT', planId?: string, trainerId?: string }

  @Column({ type: 'enum', enum: CampaignStatusEnum, enumName: 'campaign_status_enum', default: CampaignStatusEnum.DRAFT })
  status!: CampaignStatusEnum;

  @Column('timestamptz', { name: 'scheduled_at', nullable: true })
  scheduledAt!: Date | null;

  @Column('uuid', { name: 'created_by_user_id' })
  createdByUserId!: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
