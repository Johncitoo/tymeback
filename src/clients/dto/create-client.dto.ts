import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsPhoneNumber,
  IsString,
  IsUUID,
  MaxLength,
  ValidateIf,
  IsDateString,
} from 'class-validator';
import { NormalizeRut } from '../../common/transformers/normalize-rut.transformer';
import { IsRut } from '../../common/validators/is-rut.decorator';
import { Transform } from 'class-transformer';

export enum GenderIdentityEnum {
  FEMALE = 'female',
  MALE = 'male',
  NON_BINARY = 'non_binary',
  OTHER = 'other',
}

export enum BiologicalSexEnum {
  FEMALE = 'female',
  MALE = 'male',
}

export class CreateClientDto {
  @IsNotEmpty()
  @IsUUID()
  gymId!: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  firstName!: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  lastName!: string;

  // Email OPCIONAL (confirmado por ti)
  @IsOptional()
  @IsEmail()
  @MaxLength(160)
  email?: string;

  // Si no hay email, exige motivo (auditoría/UX)
  @ValidateIf(o => !o.email)
  @IsNotEmpty({ message: 'Debe indicar motivo si el cliente no tiene email' })
  @IsString()
  @MaxLength(200)
  noEmailReason?: string;

  @IsOptional()
  @IsPhoneNumber('CL', { message: 'Teléfono inválido' })
  phone?: string;

  // RUT normalizado + validado
  @IsNotEmpty()
  @IsString()
  @NormalizeRut()
  @IsRut({ message: 'RUT inválido' })
  rut!: string;

  @IsOptional()
  @IsDateString({}, { message: 'birthDate debe ser ISO-8601 (YYYY-MM-DD o fecha ISO)' })
  // Si te llega "YYYY-MM-DD", deja tal cual; si llega ISO, puedes transformarlo en service.
  birthDate?: string;

  // “Género” (identidad)
  @IsOptional()
  @IsEnum(GenderIdentityEnum)
  gender?: GenderIdentityEnum;

  // “Sexo biológico”
  @IsOptional()
  @IsEnum(BiologicalSexEnum)
  biologicalSex?: BiologicalSexEnum;

  @IsOptional()
  @IsString()
  @MaxLength(240)
  address?: string;

  // Avatar URL opcional (si frontend sube a GCS primero)
  @IsOptional()
  @IsString()
  @MaxLength(500)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  avatarUrl?: string;

  // Trainer asignado opcional (puede ser “sin entrenador”)
  @IsOptional()
  @IsString()
  trainerId?: string;
}
