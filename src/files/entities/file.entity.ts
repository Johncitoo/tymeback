import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum FilePurposeEnum {
  AVATAR = 'AVATAR',
  EXERCISE_IMAGE = 'EXERCISE_IMAGE',
  MACHINE_IMAGE = 'MACHINE_IMAGE',
  PROOF = 'PROOF', // comprobante pago
  INBODY_PDF = 'INBODY_PDF',
  PROGRESS_PHOTO = 'PROGRESS_PHOTO',
  CERTIFICATE = 'CERTIFICATE', // títulos entrenador
  OTHER = 'OTHER',
}

export enum FileStatusEnum {
  PENDING = 'PENDING',
  READY = 'READY',
  DELETED = 'DELETED',
}

@Entity({ name: 'files' })
@Index(['gymId', 'purpose'])
@Index(['gymId', 'ownerUserId'])
export class AppFile {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid', { name: 'gym_id' })
  gymId!: string;

  @Column('uuid', { name: 'owner_user_id', nullable: true })
  ownerUserId!: string | null;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'owner_user_id' })
  ownerUser!: User | null;

  @Column('text', { name: 'original_name' })
  originalName!: string;

  @Column('text', { name: 'mime_type' })
  mimeType!: string;

  @Column('bigint', { name: 'size_bytes', nullable: true })
  sizeBytes!: string | null; // usar string para BIGINT seguro

  @Column('text', { name: 'storage_bucket' })
  storageBucket!: string;

  @Column('text', { name: 'storage_key' })
  storageKey!: string; // path dentro del bucket

  @Column('text', { name: 'public_url', nullable: true })
  publicUrl!: string | null;

  @Column('enum', {
    enum: FilePurposeEnum,
    name: 'purpose',
    default: FilePurposeEnum.OTHER,
  })
  purpose!: FilePurposeEnum;

  @Column('enum', {
    enum: FileStatusEnum,
    name: 'status',
    default: FileStatusEnum.PENDING,
  })
  status!: FileStatusEnum;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt!: Date;
}
