import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, Min, Matches } from 'class-validator';

export class SalesSeriesDto {
  @IsOptional()
  @Matches(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, {
    message: 'gymId must be a valid UUID format'
  })
  gymId?: string;

  // cantidad de meses hacia atrás (incluye el mes de endMonth); default 12
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(36)
  months: number = 12;

  // mes final (YYYY-MM). Si no viene, usa mes actual local.
  @IsOptional()
  @IsString()
  endMonth?: string; // ej. "2025-10"
}
