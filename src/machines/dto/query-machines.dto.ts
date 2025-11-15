import { Type } from 'class-transformer';
import {
  IsBooleanString,
  IsEnum,
  IsOptional,
  IsString,
  Matches,
  IsInt,
  Min,
} from 'class-validator';
import { MachineTypeEnum } from '../entities/machine.entity';

export class QueryMachinesDto {
  @Matches(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, {
    message: 'gymId must be a valid UUID format',
  })
  gymId!: string;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(MachineTypeEnum)
  type?: MachineTypeEnum;

  @IsOptional()
  @IsBooleanString()
  isOperational?: string;

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
