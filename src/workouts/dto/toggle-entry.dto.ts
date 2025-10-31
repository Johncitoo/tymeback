import { IsBoolean, IsOptional, IsUUID } from 'class-validator';

export class ToggleEntryDto {
  @IsUUID()
  gymId!: string;

  @IsUUID()
  sessionId!: string;

  @IsUUID()
  rdeId!: string;

  @IsBoolean()
  done!: boolean;

  @IsOptional()
  notes?: string;
}
