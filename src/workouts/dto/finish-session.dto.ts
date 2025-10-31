// src/workouts/dto/finish-session.dto.ts
import { IsOptional, IsString } from 'class-validator';

export class FinishSessionDto {
  @IsOptional()
  @IsString()
  note?: string;
}
