import { Type } from 'class-transformer';
import { IsOptional, IsUUID, IsInt, Min, IsDateString } from 'class-validator';

export class QueryPrsDto {
  @IsUUID()
  gymId!: string;

  @IsUUID()
  clientId!: string;

  @IsOptional()
  @IsUUID()
  exerciseId?: string;

  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset?: number = 0;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 50;
}
