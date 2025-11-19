import { Type } from 'class-transformer';
import { IsUUID, IsOptional, IsDateString, IsInt, Min } from 'class-validator';

export class QueryProgressPhotosDto {
  @IsOptional()
  @IsUUID()
  gymId?: string;

  @IsOptional()
  @IsUUID()
  clientId?: string;

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
