import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity({ name: 'nutrition_plans' })
@Index(['gymId', 'clientId', 'isActive'])
export class NutritionPlan {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid', { name: 'gym_id' })
  gymId!: string;

  @Column('uuid', { name: 'client_id' })
  clientId!: string;

  // nutricionista que emite (o admin)
  @Column('uuid', { name: 'nutritionist_id', nullable: true })
  nutritionistId!: string | null;

  @Column('text', { name: 'name' })
  name!: string;

  @Column('text', { name: 'description', nullable: true })
  description!: string | null;

  // archivo PDF almacenado en tu tabla files (opcional)
  @Column('uuid', { name: 'file_id', nullable: true })
  fileId!: string | null;

  // o URL directa a GCS si no usas files
  @Column('text', { name: 'pdf_url', nullable: true })
  pdfUrl!: string | null;

  @Column('date', { name: 'valid_from', nullable: true })
  validFrom!: string | null; // YYYY-MM-DD

  @Column('date', { name: 'valid_until', nullable: true })
  validUntil!: string | null; // YYYY-MM-DD

  @Column('boolean', { name: 'is_active', default: true })
  isActive!: boolean;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt!: Date;
}
