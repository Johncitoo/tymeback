// src/machines/dto/toggle-status.dto.ts
import { IsBoolean, IsOptional, IsString, IsUUID } from 'class-validator';

export class ToggleStatusDto {
  @IsUUID()
  gymId!: string;

  @IsBoolean()
  isOperational!: boolean;

  @IsOptional()
  @IsString()
  reason?: string;

  // quién realizó el cambio (admin/trainer)
  @IsOptional()
  @IsUUID()
  byUserId?: string;
}
