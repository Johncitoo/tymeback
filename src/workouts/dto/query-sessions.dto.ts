import { Type } from 'class-transformer';
import { IsOptional, IsUUID, IsInt, Min } from 'class-validator';

export class QuerySessionsDto {
  @IsUUID()
  gymId!: string;

  @IsUUID()
  clientId!: string;

  @IsOptional()
  weekStart?: string; // YYYY-MM-DD (domingo). Si no viene, se usa la semana actual.

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  dayIndex?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset?: number = 0;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 20;
}
