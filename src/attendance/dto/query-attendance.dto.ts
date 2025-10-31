import { IsUUID, IsOptional, IsInt, Min, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryAttendanceDto {
  @IsUUID() gymId!: string;
  @IsOptional() @IsUUID() clientId?: string;

  @IsOptional() @IsDateString() from?: string;
  @IsOptional() @IsDateString() to?: string;

  @IsOptional() @Type(() => Number) @IsInt() @Min(0) offset?: number = 0;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) limit?: number = 20;

  /** Incluir solo abiertas (sin checkout) */
  @IsOptional() openOnly?: 'true' | 'false';
}
