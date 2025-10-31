import {
  IsUUID,
  IsOptional,
  IsString,
  IsUrl,
  IsBoolean,
  IsDateString,
} from 'class-validator';

export class CreateNutritionPlanDto {
  @IsUUID()
  gymId!: string;

  @IsUUID()
  clientId!: string;

  // quien crea (nutricionista o admin)
  @IsUUID()
  createdByUserId!: string;

  @IsOptional()
  @IsUUID()
  nutritionistId?: string;

  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsUUID()
  fileId?: string;

  @IsOptional()
  @IsUrl()
  pdfUrl?: string;

  @IsOptional()
  @IsDateString()
  validFrom?: string; // YYYY-MM-DD

  @IsOptional()
  @IsDateString()
  validUntil?: string; // YYYY-MM-DD

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
