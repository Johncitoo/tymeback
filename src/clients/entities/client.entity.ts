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
  // PK = gym_user_id (FK a gym_users.id)
  @PrimaryColumn('uuid', { name: 'gym_user_id' })
  gymUserId!: string;

  @Index()
  @Column('uuid', { name: 'trainer_gym_user_id', nullable: true })
  trainerGymUserId!: string | null;

  @Index()
  @Column('uuid', { name: 'nutritionist_gym_user_id', nullable: true })
  nutritionistGymUserId!: string | null;

  @Column('text', { name: 'private_sessions_note', nullable: true })
  privateSessionsNote!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
