import { PartialType } from '@nestjs/mapped-types';
import { CreatePrDto } from './create-pr.dto';
import { IsOptional, IsNumber, IsInt, Min, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdatePrDto extends PartialType(CreatePrDto) {
  @IsOptional()
  @IsDateString()
  recordedAt?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.1)
  weightKg?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  reps?: number;

  @IsOptional()
  notes?: string;
}
