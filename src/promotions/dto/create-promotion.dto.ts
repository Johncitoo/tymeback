import { IsString, IsEnum, IsInt, IsBoolean, IsOptional, IsDate, IsArray, Min, Max, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';

export enum PromotionType {
  PERCENTAGE = 'PERCENTAGE',
  FIXED = 'FIXED'
}

export class CreatePromotionDto {
  @IsString()
  gymId: string;

  @IsString()
  @MaxLength(100)
  name: string;

  @IsString()
  @MaxLength(50)
  code: string;

  @IsEnum(PromotionType)
  type: PromotionType;

  @IsInt()
  @Min(0)
  @Max(100) // Max 100% or reasonable fixed amount
  discountValue: number;

  @IsDate()
  @Type(() => Date)
  validFrom: Date;

  @IsDate()
  @Type(() => Date)
  validUntil: Date;

  @IsOptional()
  @IsInt()
  @Min(1)
  maxUses?: number;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  applicablePlanIds?: string[];
}
