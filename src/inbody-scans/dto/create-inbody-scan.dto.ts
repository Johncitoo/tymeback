import { IsUUID, IsOptional, IsDateString, IsObject, IsString, IsUrl } from 'class-validator';

export class CreateInbodyScanDto {
  @IsOptional()
  @IsUUID()
  gymId?: string;

  @IsUUID()
  clientId!: string;

  // quien crea (nutricionista o admin)
  @IsUUID()
  createdByUserId!: string;

  @IsOptional()
  @IsUUID()
  nutritionistId?: string;

  @IsOptional()
  @IsDateString()
  scanDate?: string; // ISO

  @IsOptional()
  @IsObject()
  data?: Record<string, any>;

  @IsOptional()
  @IsUUID()
  fileId?: string;

  @IsOptional()
  @IsUrl()
  pdfUrl?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
