import { Type } from 'class-transformer';
import { IsDateString, IsInt, IsOptional, IsUUID, Min } from 'class-validator';

export class QueryAnamnesesDto {
  @IsUUID()
  gymId!: string;

  @IsUUID()
  @IsOptional()
  clientId?: string;

  @IsUUID()
  @IsOptional()
  nutritionistId?: string;

  @IsDateString()
  @IsOptional()
  dateFrom?: string; // filtra takenAt >= dateFrom

  @IsDateString()
  @IsOptional()
  dateTo?: string;   // filtra takenAt <= dateTo

  @Type(() => Number)
  @IsInt()
  @Min(0)
  @IsOptional()
  offset?: number = 0;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  limit?: number = 20;
}
