import { IsUUID, IsOptional, IsDateString, IsObject, IsString } from 'class-validator';

export class UpdateBodyEvaluationDto {
  @IsUUID()
  gymId!: string;

  // quien edita (nutricionista/admin)
  @IsUUID()
  updatedByUserId!: string;

  @IsOptional()
  @IsDateString()
  measuredAt?: string;

  @IsOptional()
  @IsObject()
  data?: Record<string, any>;

  @IsOptional()
  @IsString()
  notes?: string;
}
