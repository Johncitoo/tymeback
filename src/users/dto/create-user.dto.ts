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
  IsArray,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { GenderEnum, RoleEnum, SexEnum } from '../entities/user.entity';
import { IsValidRut } from './rut.validator';

export class CreateUserDto {
  // gymId se inyecta desde req.user.gymId (del JWT del admin)
  
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
  @IsArray()
  @IsString({ each: true })
  specialties?: string[];

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
