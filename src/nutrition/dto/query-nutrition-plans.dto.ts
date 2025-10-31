import { IsUUID, IsOptional, IsBoolean, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryNutritionPlansDto {
  @IsUUID() gymId!: string;
  @IsOptional() @IsUUID() clientId?: string;

  @IsOptional() @Type(() => Boolean) @IsBoolean() isActive?: boolean;

  @IsOptional() @Type(() => Number) @IsInt() @Min(0) offset?: number = 0;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) limit?: number = 20;
}
