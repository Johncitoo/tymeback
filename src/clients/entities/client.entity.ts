// src/clients/entities/client.entity.ts
import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity({ name: 'clients' })
export class Client {
  // PK = user_id (FK a users.id)
  @PrimaryColumn('uuid', { name: 'user_id' })
  userId!: string;

  @Index()
  @Column('uuid', { name: 'trainer_id', nullable: true })
  trainerId!: string | null;

  @Index()
  @Column('uuid', { name: 'nutritionist_id', nullable: true })
  nutritionistId!: string | null;

  @Column('text', { name: 'private_sessions_note', nullable: true })
  privateSessionsNote!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
