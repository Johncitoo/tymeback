import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum PromotionTypeEnum {
  PERCENTAGE = 'PERCENTAGE', // Descuento en porcentaje
  FIXED = 'FIXED', // Descuento fijo en CLP
}

@Entity({ name: 'promotions' })
export class Promotion {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid', { name: 'gym_id' })
  gymId!: string;

  @Column('text')
  name!: string;

  @Column('text', { nullable: true })
  description!: string | null;

  @Column('text', { unique: true, nullable: true })
  code!: string | null; // Código promocional (ej: "VERANO2025")

  @Column({
    type: 'enum',
    enum: PromotionTypeEnum,
    default: PromotionTypeEnum.PERCENTAGE,
  })
  type!: PromotionTypeEnum;

  @Column('int', { name: 'discount_value' })
  discountValue!: number; // 10 = 10% o $10.000 según type

  @Column('date', { name: 'valid_from' })
  validFrom!: string;

  @Column('date', { name: 'valid_until' })
  validUntil!: string;

  @Column('int', { name: 'max_uses', nullable: true })
  maxUses!: number | null; // Límite de usos (null = ilimitado)

  @Column('int', { name: 'times_used', default: 0 })
  timesUsed!: number;

  @Column('boolean', { name: 'is_active', default: true })
  isActive!: boolean;

  // A qué planes aplica (null = todos)
  @Column('simple-array', { name: 'applicable_plan_ids', nullable: true })
  applicablePlanIds!: string[] | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
