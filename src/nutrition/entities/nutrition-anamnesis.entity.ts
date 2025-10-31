import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity({ name: 'nutrition_anamneses' })
@Index(['gymId', 'clientId'])
@Index(['gymId', 'takenAt'])
export class NutritionAnamnesis {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  // multi-gimnasio
  @Column('uuid', { name: 'gym_id' })
  gymId!: string;

  // CLIENT
  @Column('uuid', { name: 'client_id' })
  clientId!: string;

  // NUTRITIONIST (puede ser null si lo creó un admin sin asignar aún)
  @Column('uuid', { name: 'nutritionist_id', nullable: true })
  nutritionistId!: string | null;

  @Column('timestamptz', { name: 'taken_at', default: () => 'NOW()' })
  takenAt!: Date;

  // JSONB libres
  @Column('jsonb', { nullable: true })
  lifestyle!: Record<string, any> | null; // hábitos, sueño, actividad, consumo

  @Column('jsonb', { nullable: true })
  clinical!: Record<string, any> | null; // antecedentes, fármacos, alergias

  @Column('text', { nullable: true })
  goals!: string | null;

  @Column('text', { nullable: true })
  notes!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
