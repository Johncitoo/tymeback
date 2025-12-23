import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

export enum MassEmailStatus {
  DRAFT = 'DRAFT',
  SENDING = 'SENDING',
  SENT = 'SENT',
  FAILED = 'FAILED',
}

export enum RecipientFilterType {
  ALL_USERS = 'ALL_USERS',
  ALL_ACTIVE = 'ALL_ACTIVE',
  ALL_INACTIVE = 'ALL_INACTIVE',
  SPECIFIC_USERS = 'SPECIFIC_USERS',
  BY_MEMBERSHIP = 'BY_MEMBERSHIP',
  BY_GENDER = 'BY_GENDER',
  CUSTOM = 'CUSTOM',
}

/**
 * Registro de envíos masivos de correo
 */
@Entity({ name: 'mass_emails' })
export class MassEmail {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid', { name: 'gym_id' })
  gymId!: string;

  @Column('uuid', { name: 'created_by_user_id', nullable: true })
  createdByUserId?: string;

  @Column('varchar', { length: 200 })
  subject!: string;

  @Column('text', { name: 'content_body' })
  contentBody!: string;

  // Filtros aplicados
  @Column({
    type: 'enum',
    enum: RecipientFilterType,
    name: 'filter_type',
  })
  filterType!: RecipientFilterType;

  @Column('jsonb', { name: 'filter_params', nullable: true })
  filterParams?: {
    userIds?: string[];
    membershipIds?: string[];
    gender?: string;
    isActive?: boolean;
  };

  // Estadísticas de envío
  @Column('int', { name: 'total_recipients', default: 0 })
  totalRecipients!: number;

  @Column('int', { name: 'sent_count', default: 0 })
  sentCount!: number;

  @Column('int', { name: 'failed_count', default: 0 })
  failedCount!: number;

  @Column({
    type: 'enum',
    enum: MassEmailStatus,
    default: MassEmailStatus.DRAFT,
  })
  status!: MassEmailStatus;

  @Column('timestamptz', { name: 'sent_at', nullable: true })
  sentAt?: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
