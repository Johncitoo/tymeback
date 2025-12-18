// src/users/dto/create-user.dto.ts
import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MinLength,
  IsBoolean,
  IsDateString,
  Matches,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { GenderEnum, RoleEnum, SexEnum } from '../entities/user.entity';
import { IsValidRut } from './rut.validator';

export class CreateUserDto {
  // Requerimos gymId por ahora (luego lo inyectaremos desde JWT/guard)
  @Matches(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, {
    message: 'gymId must be a valid UUID format'
  })
  gymId!: string;

  @IsEnum(RoleEnum)
  role!: RoleEnum;

  @IsString()
  @MinLength(2)
  firstName!: string;

  @IsString()
  @MinLength(2)
  lastName!: string;

  @IsOptional()
  @IsEmail()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  email?: string;

  // La clave inicial puede venir null. Si viene, debe tener política mínima (8+, 1 mayus, 1 min, 1 dígito, 1 símbolo)
  @IsOptional()
  @IsString()
  @MinLength(8)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  password?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  @IsValidRut()
  rut?: string;

  @IsOptional()
  @IsDateString()
  birthDate?: string;

  @IsOptional()
  @IsEnum(GenderEnum)
  gender?: GenderEnum;

  @IsOptional()
  @IsEnum(SexEnum)
  sex?: SexEnum;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  avatarUrl?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
