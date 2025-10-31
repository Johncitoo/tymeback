// src/users/dto/query-users.dto.ts
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';
import { RoleEnum } from '../entities/user.entity';

export class QueryUsersDto {
  // por ahora exigimos gymId en query; luego lo resolveremos por JWT/guard
  @IsUUID()
  gymId!: string;

  @IsOptional()
  @IsString()
  q?: string;

  @IsOptional()
  @IsEnum(RoleEnum)
  role?: RoleEnum;

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
