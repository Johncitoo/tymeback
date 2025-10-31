// src/memberships/dto/use-session.dto.ts
import { IsInt, IsOptional, IsUUID, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class UseSessionDto {
  @IsUUID()
  gymId!: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  count: number = 1;

  // Opcional nota para auditoría/razón
  @IsOptional()
  note?: string;
}
