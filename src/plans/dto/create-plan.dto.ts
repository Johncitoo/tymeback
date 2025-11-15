import { Matches, IsString, IsOptional, IsInt, Min, IsBoolean } from 'class-validator';

export class CreatePlanDto {
  @Matches(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, {
    message: 'gymId must be a valid UUID format',
  })
  gymId!: string;
  @IsString() name!: string;
  @IsOptional() @IsString() description?: string;

  @IsOptional() @IsInt() @Min(1) durationMonths?: number;
  @IsOptional() @IsInt() @Min(1) durationDays?: number;

  @IsInt() @Min(0) priceClp!: number;
  @IsOptional() @IsInt() @Min(0) privateSessionsPerPeriod?: number;

  @IsOptional() @IsBoolean() isActive?: boolean = true;
}
