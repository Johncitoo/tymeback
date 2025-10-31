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

  @Column('enum', { enum: MachineTypeEnum, name: 'type', default: MachineTypeEnum.STRENGTH })
  type!: MachineTypeEnum;

  @Column('enum', { enum: MuscleGroupEnum, name: 'muscle_group', default: MuscleGroupEnum.OTHER })
  muscleGroup!: MuscleGroupEnum;

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

  @Column('uuid', { name: 'image_file_id', nullable: true })
  imageFileId!: string | null;

  // Estado
  @Column('boolean', { name: 'is_active', default: true })
  isActive!: boolean;

  @Column('boolean', { name: 'in_service', default: true })
  inService!: boolean;

  // Extras opcionales
  @Column('text', { name: 'serial_number', nullable: true })
  serialNumber!: string | null;

  @Column('date', { name: 'purchase_date', nullable: true })
  purchaseDate!: string | null; // ISO yyyy-mm-dd

  @Column('text', { name: 'warranty_info', nullable: true })
  warrantyInfo!: string | null;

  @Column('text', { name: 'location', nullable: true })
  location!: string | null;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt!: Date;

  @DeleteDateColumn({ type: 'timestamptz', name: 'deleted_at', nullable: true })
  deletedAt!: Date | null;
}
