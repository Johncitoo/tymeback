import { Type } from 'class-transformer';
import { IsOptional, IsUUID, IsInt, Min, IsBooleanString } from 'class-validator';

export class QueryAssignmentsDto {
  @IsUUID()
  gymId!: string;

  @IsOptional()
  @IsUUID()
  routineId?: string;

  @IsOptional()
  @IsUUID()
  clientId?: string;

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
