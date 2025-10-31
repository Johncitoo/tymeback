import { IsUUID, IsOptional, IsDateString, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryAnamnesesDto {
  @IsUUID() gymId!: string;
  @IsOptional() @IsUUID() clientId?: string;

  @IsOptional() @IsDateString() from?: string;
  @IsOptional() @IsDateString() to?: string;

  @IsOptional() @Type(() => Number) @IsInt() @Min(0) offset?: number = 0;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) limit?: number = 20;
}
