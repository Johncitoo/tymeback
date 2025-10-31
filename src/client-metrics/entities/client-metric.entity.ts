import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
  CreateDateColumn,
  UpdateDateColumn,
  BeforeInsert,
  BeforeUpdate,
} from 'typeorm';

@Entity({ name: 'client_metrics' })
@Index(['gymId', 'clientId', 'measuredAt'])
export class ClientMetric {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid', { name: 'gym_id' })
  gymId!: string;

  @Column('uuid', { name: 'client_id' })
  clientId!: string;

  @Column('timestamptz', { name: 'measured_at', default: () => 'now()' })
  measuredAt!: Date;

  @Column('float', { name: 'weight_kg', nullable: true })
  weightKg!: number | null;

  @Column('float', { name: 'height_cm', nullable: true })
  heightCm!: number | null;

  @Column('float', { name: 'body_fat_percent', nullable: true })
  bodyFatPercent!: number | null;

  @Column('float', { name: 'muscle_kg', nullable: true })
  muscleKg!: number | null;

  @Column('float', { name: 'bmi', nullable: true })
  bmi!: number | null;

  @Column('text', { name: 'notes', nullable: true })
  notes!: string | null;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt!: Date;

  @BeforeInsert()
  @BeforeUpdate()
  computeBmi() {
    if (this.weightKg != null && this.heightCm != null && this.heightCm > 0) {
      const h = this.heightCm / 100;
      const bmiVal = this.weightKg / (h * h);
      this.bmi = Math.round(bmiVal * 10) / 10; // 1 decimal
    }
  }
}
