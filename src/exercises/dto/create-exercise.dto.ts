import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { ExerciseTypeEnum, DifficultyEnum } from '../entities/exercise.entity';
import { MuscleGroupEnum } from '../../machines/entities/machine.entity';

export class CreateExerciseDto {
  @IsUUID()
  gymId!: string;

  @IsString()
  name!: string;

  @IsOptional()
  @IsEnum(ExerciseTypeEnum)
  type?: ExerciseTypeEnum;

  @IsOptional()
  @IsEnum(DifficultyEnum)
  difficulty?: DifficultyEnum;

  @IsEnum(MuscleGroupEnum)
  muscleGroup!: MuscleGroupEnum;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsOptional()
  @IsString()
  videoUrl?: string;

  @IsOptional()
  @IsUUID()
  machineId?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isActive?: boolean;
}
