import { IsUUID, IsOptional, Matches, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryMembershipsDto {
  @IsUUID('all') gymId!: string;

  @IsOptional() @IsUUID('all') clientId?: string;

  /** YYYY-MM-DD filtros opcionales por vigencia */
  @IsOptional() @Matches(/^\d{4}-\d{2}-\d{2}$/) activeAt?: string;

  @IsOptional() @Type(() => Number) @IsInt() @Min(0) offset?: number = 0;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) limit?: number = 20;
}
