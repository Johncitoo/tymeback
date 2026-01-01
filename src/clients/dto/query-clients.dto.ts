// src/clients/dto/query-clients.dto.ts
import { Type } from 'class-transformer';
import { IsBoolean, IsInt, IsOptional, IsString, IsUUID, Max, Min, Matches } from 'class-validator';

export class QueryClientsDto {
  @IsOptional()
  @IsUUID('all')
  gymId?: string;

  @IsOptional()
  @IsString()
  q?: string;

  @IsOptional()
  @IsUUID('all')
  trainerId?: string;

  @IsOptional()
  @Type(() => Boolean)
  isActive?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset: number = 0;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number = 20;
}
