// src/payments/dto/stats-payments.dto.ts
import { IsDateString, IsOptional, IsUUID } from 'class-validator';

export class StatsPaymentsDto {
  @IsUUID()
  gymId!: string;

  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @IsOptional()
  @IsDateString()
  dateTo?: string;
}
