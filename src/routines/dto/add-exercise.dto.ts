import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class AddExerciseDto {
  @IsUUID()
  gymId!: string;

  @IsUUID()
  routineId!: string;

  @IsUUID()
  dayId!: string;

  @IsUUID()
  exerciseId!: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  orderIndex?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  sets?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  reps?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  restSeconds?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}
