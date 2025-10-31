import { Type } from 'class-transformer';
import {
  IsBooleanString,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  IsInt,
  Min,
} from 'class-validator';
import { ExerciseTypeEnum, DifficultyEnum } from '../entities/exercise.entity';
import { MuscleGroupEnum } from '../../machines/entities/machine.entity';

export class QueryExercisesDto {
  @IsUUID()
  gymId!: string;

  @IsOptional()
  @IsString()
  search?: string; // nombre (ILIKE)

  @IsOptional()
  @IsEnum(ExerciseTypeEnum)
  type?: ExerciseTypeEnum;

  @IsOptional()
  @IsEnum(MuscleGroupEnum)
  muscleGroup?: MuscleGroupEnum;

  @IsOptional()
  @IsEnum(DifficultyEnum)
  difficulty?: DifficultyEnum;

  @IsOptional()
  @IsUUID()
  machineId?: string;

  @IsOptional()
  @IsBooleanString()
  isActive?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset?: number = 0;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 20;
}
