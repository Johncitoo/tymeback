// src/pr-records/dto/create-pr.dto.ts
import { IsDateString, IsNumber, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';

export class CreatePrDto {
  @IsUUID()
  gymId!: string;

  @IsUUID()
  clientId!: string;

  @IsUUID()
  exerciseId!: string;

  @IsNumber()
  @Min(0)
  @Max(9999)
  weightKg!: number;

  @IsNumber()
  @Min(1)
  @Max(1000)
  reps!: number;

  @IsOptional()
  @IsDateString()
  performedAt?: string; // ISO

  @IsOptional()
  @IsString()
  note?: string;
}
