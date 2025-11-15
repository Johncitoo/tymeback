import { IsOptional, IsString, Matches } from 'class-validator';

export class DashboardSummaryDto {
  @IsOptional()
  @Matches(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, {
    message: 'gymId must be a valid UUID format'
  })
  gymId?: string;

  // opcional: ISO YYYY-MM para centrar el panel en un mes concreto (por defecto: mes actual)
  @IsOptional()
  @IsString()
  month?: string; // ej. "2025-10"
}
