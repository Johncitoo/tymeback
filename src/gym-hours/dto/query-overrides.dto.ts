import { IsUUID, IsOptional, Matches, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryOverridesDto {
  @IsUUID()
  gymId!: string;

  /** YYYY-MM-DD */
  @IsOptional() @Matches(/^\d{4}-\d{2}-\d{2}$/)
  dateFrom?: string;

  /** YYYY-MM-DD */
  @IsOptional() @Matches(/^\d{4}-\d{2}-\d{2}$/)
  dateTo?: string;

  @IsOptional() @Type(() => Number) @IsInt() @Min(0)
  offset?: number = 0;

  @IsOptional() @Type(() => Number) @IsInt() @Min(1)
  limit?: number = 50;
}
