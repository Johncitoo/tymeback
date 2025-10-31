import { Type } from 'class-transformer';
import { IsBooleanString, IsOptional, IsString, IsUUID, IsInt, Min } from 'class-validator';

export class QueryRoutinesDto {
  @IsUUID()
  gymId!: string;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsBooleanString()
  isActive?: string;

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
