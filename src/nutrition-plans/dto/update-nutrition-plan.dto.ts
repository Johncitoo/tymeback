import {
  IsUUID,
  IsOptional,
  IsString,
  IsUrl,
  IsBoolean,
  IsDateString,
} from 'class-validator';

export class UpdateNutritionPlanDto {
  @IsUUID()
  gymId!: string;

  // quien edita (nutricionista o admin)
  @IsUUID()
  updatedByUserId!: string;

  @IsOptional()
  @IsString()
  name?: string;

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
  validFrom?: string;

  @IsOptional()
  @IsDateString()
  validUntil?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
