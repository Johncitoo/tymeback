import { IsUUID, IsNumber, IsInt, Min, IsOptional, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';

export class CreatePrDto {
  @IsUUID()
  gymId!: string;

  @IsUUID()
  clientId!: string;

  @IsUUID()
  exerciseId!: string;

  @IsOptional()
  @IsDateString()
  recordedAt?: string; // ISO; si no viene -> NOW()

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.1)
  weightKg!: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  reps!: number;

  @IsOptional()
  notes?: string;

  @IsOptional()
  @IsUUID()
  createdByUserId?: string;
}
