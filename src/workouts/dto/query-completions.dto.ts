// src/workouts/dto/query-completions.dto.ts
import { IsDateString, IsOptional, IsUUID } from 'class-validator';

export class QueryCompletionsDto {
  @IsUUID()
  gymId!: string;

  @IsUUID()
  clientId!: string;

  @IsUUID()
  assignmentId!: string;

  @IsOptional()
  @IsDateString()
  weekStart?: string;
}
