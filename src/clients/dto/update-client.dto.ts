// src/clients/dto/update-client.dto.ts
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { GenderEnum, RoleEnum, SexEnum } from '../../users/entities/user.entity';
import { EmergencyContactDto } from './emergency-contact.dto';
import { IsValidRut } from '../../users/dto/rut.validator';

export class UpdateClientDto {
  // User fields
  @IsOptional()
  @IsString()
  @MinLength(2)
  fullName?: string;

  @IsOptional()
  @IsEmail()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  email?: string | null;

  @IsOptional()
  @IsString()
  @MinLength(8)
  password?: string;

  @IsOptional()
  @IsString()
  phone?: string | null;

  @IsOptional()
  @IsString()
  @IsValidRut()
  rut?: string | null;

  @IsOptional()
  @IsDateString()
  birthDate?: string | null;

  @IsOptional()
  @IsEnum(GenderEnum)
  gender?: GenderEnum | null;

  @IsOptional()
  @IsEnum(SexEnum)
  sex?: SexEnum | null;

  @IsOptional()
  @IsString()
  address?: string | null;

  @IsOptional()
  @IsString()
  avatarUrl?: string | null;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  // Client fields
  @IsOptional()
  @IsUUID()
  trainerId?: string | null;

  @IsOptional()
  @IsUUID()
  nutritionistId?: string | null;

  @IsOptional()
  @IsString()
  privateSessionsNote?: string | null;

  // Reemplazo completo de contactos (opcional)
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EmergencyContactDto)
  emergencyContacts?: EmergencyContactDto[];

  
}
