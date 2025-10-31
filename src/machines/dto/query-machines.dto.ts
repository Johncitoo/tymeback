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
import { MachineTypeEnum, MuscleGroupEnum } from '../entities/machine.entity';

export class QueryMachinesDto {
  @IsUUID()
  gymId!: string;

  @IsOptional()
  @IsString()
  search?: string; // nombre (ILIKE)

  @IsOptional()
  @IsEnum(MachineTypeEnum)
  type?: MachineTypeEnum;

  @IsOptional()
  @IsEnum(MuscleGroupEnum)
  muscleGroup?: MuscleGroupEnum;

  @IsOptional()
  @IsBooleanString()
  inService?: string;

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
