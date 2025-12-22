import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum AutomatedEmailType {
  PASSWORD_RESET = 'PASSWORD_RESET',
  PAYMENT_CONFIRMATION = 'PAYMENT_CONFIRMATION',
  MEMBERSHIP_EXPIRATION = 'MEMBERSHIP_EXPIRATION',
  WELCOME = 'WELCOME',
  ACCOUNT_INACTIVE = 'ACCOUNT_INACTIVE',
}

/**
 * Plantillas de correos automáticos del sistema
 * Solo se puede editar el contenido (texto), NO el HTML/diseño
 */
@Entity({ name: 'automated_email_templates' })
export class AutomatedEmailTemplate {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid', { name: 'gym_id' })
  gymId!: string;

  @Column({
    type: 'enum',
    enum: AutomatedEmailType,
    unique: false,
  })
  type!: AutomatedEmailType;

  @Column('varchar', { length: 200 })
  name!: string;

  @Column('varchar', { length: 200 })
  subject!: string;

  // Contenido editable (solo texto, sin HTML)
  @Column('text', { name: 'content_body' })
  contentBody!: string;

  // Variables disponibles para este tipo de correo
  @Column('jsonb', { name: 'available_variables', default: '[]' })
  availableVariables!: string[];

  @Column('boolean', { name: 'is_active', default: true })
  isActive!: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
