// src/memberships/dto/update-membership.dto.ts
import { IsDateString, IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { MembershipStatus } from '../entities/membership.entity';

export class UpdateMembershipDto {
  @IsOptional()
  @IsEnum(MembershipStatus)
  status?: MembershipStatus;

  // Permite ajustar fechas por casos administrativos (evitar solapes en backend)
  @IsOptional()
  @IsDateString()
  startDate?: string | null;

  @IsOptional()
  @IsDateString()
  endDate?: string | null;

  @IsOptional()
  @IsString()
  note?: string | null;

  // Ajustar cupo o consumo manualmente (auditar en logs luego)
  @IsOptional()
  @IsInt()
  @Min(0)
  sessionsQuota?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  sessionsUsed?: number;
}
