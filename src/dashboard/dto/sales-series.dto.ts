import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';

export class SalesSeriesDto {
  @IsUUID()
  gymId!: string;

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
