// src/users/entities/user.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  Index,
} from 'typeorm';

export enum RoleEnum {
  ADMIN = 'ADMIN',
  TRAINER = 'TRAINER',
  NUTRITIONIST = 'NUTRITIONIST',
  CLIENT = 'CLIENT',
}

export enum GenderEnum {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
  NON_BINARY = 'NON_BINARY',
  OTHER = 'OTHER',
  PREFER_NOT = 'PREFER_NOT',
}

export enum SexEnum {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
  INTERSEX = 'INTERSEX',
  UNKNOWN = 'UNKNOWN',
}

@Entity({ name: 'users' })
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  // Multi-gimnasio
  @Index()
  @Column('uuid', { name: 'gym_id' })
  gymId!: string;

  @Index()
  @Column('citext', { nullable: true })
  email!: string | null;

  @Column('text', { name: 'hashed_password', nullable: true })
  hashedPassword!: string | null;

  @Index()
  @Column({
    type: 'enum',
    enum: RoleEnum,
    enumName: 'role_enum', // usa el enum de Postgres existente
  })
  role!: RoleEnum;

  @Column('text', { name: 'first_name' })
  firstName!: string;

  @Column('text', { name: 'last_name' })
  lastName!: string;

  // Columna computed (generada automáticamente en BD)
  @Column('text', { name: 'full_name', insert: false, update: false })
  fullName!: string;

  @Column('text', { nullable: true })
  phone!: string | null;

  @Index()
  @Column('text', { nullable: true })
  rut!: string | null;

  @Column('date', { name: 'birth_date', nullable: true })
  birthDate!: Date | null;

  @Column({
    type: 'enum',
    enum: GenderEnum,
    enumName: 'gender_enum',
    nullable: true,
  })
  gender!: GenderEnum | null;

  @Column({
    type: 'enum',
    enum: SexEnum,
    enumName: 'sex_enum',
    nullable: true,
  })
  sex!: SexEnum | null;

  @Column('text', { nullable: true })
  address!: string | null;

  @Column('text', { name: 'avatar_url', nullable: true })
  avatarUrl!: string | null;

  @Index()
  @Column('boolean', { name: 'is_active', default: true })
  isActive!: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamptz' })
  deletedAt!: Date | null;
}
