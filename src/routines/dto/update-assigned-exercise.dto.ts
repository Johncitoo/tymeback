// src/routines/dto/update-assigned-exercise.dto.ts
import { IsEnum, IsInt, IsOptional, IsUUID, Max, Min } from 'class-validator';
import { SetTypeEnum } from '../entities/routine-day-exercise.entity';

export class UpdateAssignedExerciseDto {
  @IsOptional()
  @IsEnum(SetTypeEnum)
  setType?: SetTypeEnum;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(99)
  sets?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(999)
  reps?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(3600)
  restSeconds?: number;

  // JSON con estructura libre según tipo de serie (kg/reps por set o por parte de dropset)
  @IsOptional()
  prescription?: any;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(999)
  orderIndex?: number;
}
