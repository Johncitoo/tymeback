import { Type } from 'class-transformer';
import {
  IsOptional,
  IsUUID,
  IsBooleanString,
  IsDateString,
  IsInt,
  Min,
} from 'class-validator';

export class QueryNutritionPlansDto {
  @IsUUID()
  gymId!: string;

  @IsOptional()
  @IsUUID()
  clientId?: string;

  @IsOptional()
  @IsUUID()
  nutritionistId?: string;

  // filtra por estado
  @IsOptional()
  @IsBooleanString()
  isActive?: string; // 'true' | 'false'

  // rango de vigencia (devuelve planes cuyo rango se solapa con este)
  @IsOptional()
  @IsDateString()
  dateFrom?: string; // YYYY-MM-DD

  @IsOptional()
  @IsDateString()
  dateTo?: string; // YYYY-MM-DD

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
