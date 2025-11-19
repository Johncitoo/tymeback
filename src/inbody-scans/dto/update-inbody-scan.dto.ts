import { IsUUID, IsOptional, IsDateString, IsObject, IsString, IsUrl } from 'class-validator';

export class UpdateInbodyScanDto {
  @IsOptional()
  @IsUUID()
  gymId?: string;

  // quien edita (nutricionista/admin)
  @IsUUID()
  updatedByUserId!: string;

  @IsOptional()
  @IsDateString()
  scanDate?: string;

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
