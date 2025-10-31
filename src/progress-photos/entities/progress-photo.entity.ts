import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';

@Entity({ name: 'progress_photos' })
@Index(['gymId', 'clientId', 'takenAt'])
export class ProgressPhoto {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid', { name: 'gym_id' })
  gymId!: string;

  @Column('uuid', { name: 'client_id' })
  clientId!: string;

  @Column('uuid', { name: 'file_id' })
  fileId!: string; // referencia a files.id

  @Column('timestamptz', { name: 'taken_at', default: () => 'now()' })
  takenAt!: Date;

  @Column('text', { name: 'note', nullable: true })
  note!: string | null;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt!: Date;

  @DeleteDateColumn({ type: 'timestamptz', name: 'deleted_at', nullable: true })
  deletedAt!: Date | null;
}
