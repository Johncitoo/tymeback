import {
  Entity, PrimaryGeneratedColumn, Column, Index,
  CreateDateColumn, UpdateDateColumn
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

  @Column('uuid', { name: 'nutritionist_id', nullable: true })
  nutritionistId!: string | null;

  @Column('text')
  name!: string;

  @Column('text', { nullable: true })
  description!: string | null;

  // archivo PDF en files o URL directa (uno de los dos)
  @Column('uuid', { name: 'file_id', nullable: true })
  fileId!: string | null;

  @Column('text', { name: 'pdf_url', nullable: true })
  pdfUrl!: string | null;

  @Column({ type: 'date', name: 'valid_from', nullable: true })
  validFrom!: string | null;

  @Column({ type: 'date', name: 'valid_until', nullable: true })
  validUntil!: string | null;

  @Column({ type: 'boolean', name: 'is_active', default: true })
  isActive!: boolean;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt!: Date;
}
