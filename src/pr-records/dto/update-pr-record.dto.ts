// src/pr-records/dto/update-pr.dto.ts
import { IsDateString, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

export class UpdatePrDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(9999)
  weightKg?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(1000)
  reps?: number;

  @IsOptional()
  @IsDateString()
  performedAt?: string;

  @IsOptional()
  @IsString()
  note?: string;
}
