// src/payments/dto/stats-payments.dto.ts
import { IsDateString, IsOptional, Matches } from 'class-validator';

export class StatsPaymentsDto {
  @Matches(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)
  gymId!: string;

  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @IsOptional()
  @IsDateString()
  dateTo?: string;
}
