import { IsUUID, IsOptional, IsDateString, IsObject, IsString } from 'class-validator';

export class CreateBodyEvaluationDto {
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
  measuredAt?: string; // ISO

  @IsObject()
  data!: Record<string, any>;

  @IsOptional()
  @IsString()
  notes?: string;
}
