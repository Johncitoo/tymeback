import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  Index,
} from 'typeorm';

export enum MachineTypeEnum {
  CARDIO = 'CARDIO',
  STRENGTH = 'STRENGTH',
  FUNCTIONAL = 'FUNCTIONAL',
  FLEXIBILITY = 'FLEXIBILITY',
  OTHER = 'OTHER',
}

export enum MuscleGroupEnum {
  CHEST = 'CHEST',
  BACK = 'BACK',
  SHOULDERS = 'SHOULDERS',
  ARMS = 'ARMS',
  LEGS = 'LEGS',
  CORE = 'CORE',
  FULLBODY = 'FULLBODY',
  OTHER = 'OTHER',
}

@Entity({ name: 'machines' })
@Index(['gymId', 'name'])
export class Machine {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid', { name: 'gym_id' })
  gymId!: string;

  @Column('text')
  name!: string;

  @Column('enum', { name: 'machine_type', enum: MachineTypeEnum, default: MachineTypeEnum.STRENGTH })
  type!: MachineTypeEnum;

  // Campos informativos
  @Column('text', { nullable: true })
  description!: string | null;

  @Column('text', { name: 'specs', nullable: true })
  specs!: string | null;

  @Column('text', { name: 'safety_notes', nullable: true })
  safetyNotes!: string | null;

  // Imagen
  @Column('text', { name: 'image_url', nullable: true })
  imageUrl!: string | null;

  // Estado
  @Column('boolean', { name: 'is_operational', default: true })
  isOperational!: boolean;

  // Extras opcionales
  @Column('text', { name: 'serial_number', nullable: true })
  serialNumber!: string | null;

  @Column('date', { name: 'purchase_date', nullable: true })
  purchaseDate!: string | null;

  @Column('integer', { name: 'warranty_months', nullable: true })
  warrantyMonths!: number | null;

  @Column('date', { name: 'last_maintenance', nullable: true })
  lastMaintenance!: string | null;

  @Column('text', { name: 'location', nullable: true })
  location!: string | null;

  @Column('text', { name: 'usage_notes', nullable: true })
  usageNotes!: string | null;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt!: Date;

  @DeleteDateColumn({ type: 'timestamptz', name: 'deleted_at', nullable: true })
  deletedAt!: Date | null;
}
