import {
  Entity, PrimaryGeneratedColumn, Column, Index,
  CreateDateColumn
} from 'typeorm';

@Entity({ name: 'inbody_scans' })
@Index(['gymId', 'clientId', 'scanDate'])
export class InbodyScan {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid', { name: 'gym_id' })
  gymId!: string;

  @Column('uuid', { name: 'client_id' })
  clientId!: string;

  @Column('uuid', { name: 'nutritionist_id', nullable: true })
  nutritionistId!: string | null;

  @Column({ type: 'timestamptz', name: 'scan_date', default: () => 'now()' })
  scanDate!: Date;

  // Datos segmentales, agua corporal, score, etc.
  @Column({ type: 'jsonb', nullable: true })
  data!: Record<string, any> | null;

  // PDF opcional subido a `files` (tabla de archivos)
  @Column('uuid', { name: 'file_id', nullable: true })
  fileId!: string | null;

  @Column({ type: 'text', nullable: true })
  notes!: string | null;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date;
}
