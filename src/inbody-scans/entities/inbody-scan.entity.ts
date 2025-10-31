import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
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

  // nutricionista que registra (o admin)
  @Column('uuid', { name: 'nutritionist_id', nullable: true })
  nutritionistId!: string | null;

  // fecha/hora del escaneo (timestamptz)
  @Column('timestamptz', { name: 'scan_date', default: () => 'NOW()' })
  scanDate!: Date;

  // datos estructurados: score, agua corporal, segmental, etc.
  @Column('jsonb', { name: 'data', nullable: true })
  data!: Record<string, any> | null;

  // archivo PDF opcional (id en tu tabla files)
  @Column('uuid', { name: 'file_id', nullable: true })
  fileId!: string | null;

  // o URL directa (GCS) si no usas files
  @Column('text', { name: 'pdf_url', nullable: true })
  pdfUrl!: string | null;

  @Column('text', { name: 'notes', nullable: true })
  notes!: string | null;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt!: Date;
}
