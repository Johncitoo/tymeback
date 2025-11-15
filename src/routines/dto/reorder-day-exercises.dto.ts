import { IsArray, IsUUID } from 'class-validator';

export class ReorderDayExercisesDto {
  @IsUUID('all')
  gymId!: string;

  /** lista de IDs de routine_day_exercises en el nuevo orden */
  @IsArray()
  orderedIds!: string[];
}
