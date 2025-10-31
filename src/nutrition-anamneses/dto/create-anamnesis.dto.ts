import { Type } from 'class-transformer';
import {
  IsDateString,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';

class LifestyleDto {
  // define campos libres si quieres validarlos (opcional)
}
class ClinicalDto {
  // define campos libres si quieres validarlos (opcional)
}

export class CreateAnamnesisDto {
  @IsUUID()
  gymId!: string;

  @IsUUID()
  clientId!: string;

  @IsUUID()
  @IsOptional()
  nutritionistId?: string;

  @IsDateString()
  @IsOptional()
  takenAt?: string; // ISO; default NOW()

  @ValidateNested()
  @Type(() => LifestyleDto)
  @IsOptional()
  lifestyle?: Record<string, any>;

  @ValidateNested()
  @Type(() => ClinicalDto)
  @IsOptional()
  clinical?: Record<string, any>;

  @IsString()
  @IsOptional()
  goals?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}
