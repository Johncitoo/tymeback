import { IsUUID, IsOptional, IsInt, Min, IsDateString, Matches } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryAttendanceDto {
  @IsOptional()
  @Matches(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, {
    message: 'gymId must be a valid UUID'
  })
  gymId?: string;
  
  @IsOptional()
  @Matches(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, {
    message: 'clientId must be a valid UUID format',
  })
  clientId?: string;

  @IsOptional() @IsDateString() from?: string;
  @IsOptional() @IsDateString() to?: string;

  @IsOptional() @Type(() => Number) @IsInt() @Min(0) offset?: number = 0;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) limit?: number = 20;

  /** Incluir solo abiertas (sin checkout) */
  @IsOptional() openOnly?: 'true' | 'false';
}
