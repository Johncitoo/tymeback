import { IsOptional, Matches, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryMembershipsDto {
  @Matches(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)
  gymId!: string;

  @IsOptional()
  @Matches(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)
  clientId?: string;

  /** YYYY-MM-DD filtros opcionales por vigencia */
  @IsOptional() @Matches(/^\d{4}-\d{2}-\d{2}$/) activeAt?: string;

  @IsOptional() @Type(() => Number) @IsInt() @Min(0) offset?: number = 0;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) limit?: number = 20;
}
