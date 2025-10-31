import { Type } from 'class-transformer';
import {
  IsUUID,
  IsOptional,
  IsDateString,
  IsNumber,
  Min,
  Max,
  IsString,
  Length,
} from 'class-validator';

export class CreateClientMetricDto {
  @IsUUID()
  gymId!: string;

  @IsUUID()
  clientId!: string;

  @IsOptional()
  @IsDateString()
  measuredAt?: string; // ISO; default now

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  weightKg?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  heightCm?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  bodyFatPercent?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  muscleKg?: number;

  @IsOptional()
  @IsString()
  @Length(0, 1000)
  notes?: string;
}
