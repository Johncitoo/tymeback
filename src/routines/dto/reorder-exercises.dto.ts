// src/routines/dto/reorder-exercises.dto.ts
import { ArrayNotEmpty, IsArray, IsUUID } from 'class-validator';

export class ReorderExercisesDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('4', { each: true })
  orderedIds!: string[];
}
