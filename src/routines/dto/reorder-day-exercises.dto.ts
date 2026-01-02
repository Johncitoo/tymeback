import { IsArray, Matches } from 'class-validator';

export class ReorderDayExercisesDto {
  @Matches(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)
  gymId!: string;

  /** lista de IDs de routine_day_exercises en el nuevo orden */
  @IsArray()
  orderedIds!: string[];
}
