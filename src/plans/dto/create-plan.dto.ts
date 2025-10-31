import { IsUUID, IsString, IsOptional, IsInt, Min, IsBoolean } from 'class-validator';

export class CreatePlanDto {
  @IsUUID() gymId!: string;
  @IsString() name!: string;
  @IsOptional() @IsString() description?: string;

  @IsOptional() @IsInt() @Min(1) durationMonths?: number;
  @IsOptional() @IsInt() @Min(1) durationDays?: number;

  @IsInt() @Min(0) priceClp!: number;
  @IsOptional() @IsInt() @Min(0) privateSessionsPerPeriod?: number;

  @IsOptional() @IsBoolean() isActive?: boolean = true;
}
