// src/clients/entities/emergency-contact.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'emergency_contacts' })
export class EmergencyContact {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column('uuid', { name: 'client_id' })
  clientId!: string; // = clients.user_id

  @Column('text', { name: 'full_name' })
  fullName!: string;

  @Column('text')
  phone!: string;

  @Column('text')
  relation!: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
