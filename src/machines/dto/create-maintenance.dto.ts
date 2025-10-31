import { Type } from 'class-transformer';
import {
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

export class CreateMaintenanceDto {
  @IsUUID()
  gymId!: string;

  @IsUUID()
  machineId!: string;

  @IsDateString()
  performedAt!: string;

  @IsString()
  description!: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  costClp?: number;

  @IsOptional()
  @IsUUID()
  performedByUserId?: string;

  @IsOptional()
  @IsDateString()
  nextDueAt?: string;
}
