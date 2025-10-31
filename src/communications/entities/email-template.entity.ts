import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index,
} from 'typeorm';

export enum TemplatePurposeEnum {
  GENERAL = 'GENERAL',
  REMINDER_EXPIRY = 'REMINDER_EXPIRY',
  WELCOME = 'WELCOME',
}

@Entity({ name: 'email_templates' })
@Index(['gymId', 'isActive'])
@Index(['gymId', 'purpose'])
export class EmailTemplate {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid', { name: 'gym_id' })
  gymId!: string;

  @Column('text')
  name!: string;

  @Column('text')
  subject!: string;

  @Column('text')
  html!: string; // variables {nombre} {plan} {fecha_vencimiento}

  @Column({ type: 'enum', enum: TemplatePurposeEnum, enumName: 'template_purpose_enum', default: TemplatePurposeEnum.GENERAL })
  purpose!: TemplatePurposeEnum;

  @Column('boolean', { name: 'is_active', default: true })
  isActive!: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
