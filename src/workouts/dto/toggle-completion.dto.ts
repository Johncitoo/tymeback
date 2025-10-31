// src/workouts/dto/toggle-completion.dto.ts
import { IsDateString, IsOptional, IsString, IsUUID } from 'class-validator';

export class ToggleCompletionDto {
  @IsUUID()
  gymId!: string;

  @IsUUID()
  clientId!: string;

  @IsUUID()
  assignmentId!: string;

  @IsUUID()
  assignedDayId!: string;

  @IsUUID()
  assignedExerciseId!: string;

  // YYYY-MM-DD (domingo de la semana actual). Si no viene, el backend lo calcula asumiendo domingo como inicio.
  @IsOptional()
  @IsDateString()
  weekStart?: string;

  @IsOptional()
  @IsString()
  note?: string;
}
