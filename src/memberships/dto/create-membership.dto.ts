// src/memberships/dto/create-membership.dto.ts
import { Transform, Type } from 'class-transformer';
import { IsDateString, IsInt, IsOptional, IsUUID, Min } from 'class-validator';

export class CreateMembershipDto {
  @IsUUID()
  gymId!: string;

  @IsUUID()
  clientId!: string;

  @IsUUID()
  planId!: string;

  // Si no viene, se calcula desde "hoy" (date local convertido a ISO YYYY-MM-DD)
  @IsOptional()
  @IsDateString()
  startDate?: string;

  // Opcional: forzar fin exacto (ej. migraciones). Si no viene, se calcula por plan.
  @IsOptional()
  @IsDateString()
  endDate?: string;

  // Opcional: sobrescribir cupo de sesiones privadas del plan
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  sessionsQuotaOverride?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  sessionsUsed?: number;

  @IsOptional()
  @Transform(({ value }) => (value === null ? undefined : value))
  note?: string;
}
