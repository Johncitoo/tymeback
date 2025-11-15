import { Type } from 'class-transformer';
import { IsOptional, IsUUID, IsInt, Min, IsBooleanString } from 'class-validator';

export class QueryAssignmentsDto {
  @IsOptional()
  @IsUUID('all')
  gymId?: string;

  @IsOptional()
  @IsUUID('all')
  routineId?: string;

  @IsOptional()
  @IsUUID('all')
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
