import { IsOptional, IsString, IsUUID } from 'class-validator';

export class DashboardSummaryDto {
  @IsUUID()
  gymId!: string;

  // opcional: ISO YYYY-MM para centrar el panel en un mes concreto (por defecto: mes actual)
  @IsOptional()
  @IsString()
  month?: string; // ej. "2025-10"
}
