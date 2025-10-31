// src/workouts/dto/add-entry.dto.ts
import { IsInt, IsNumber, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';

export class AddEntryDto {
  @IsUUID()
  sessionId!: string;

  @IsUUID()
  assignedExerciseId!: string;

  @IsInt()
  @Min(1)
  @Max(999)
  setIndex!: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  weightKg?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(500)
  reps?: number;

  @IsOptional()
  @IsString()
  note?: string;
}
