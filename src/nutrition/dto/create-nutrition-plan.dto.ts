import { IsUUID, IsString, IsOptional, IsDateString } from 'class-validator';

export class CreateNutritionPlanDto {
  @IsUUID() gymId!: string;
  @IsUUID() clientId!: string;
  @IsOptional() @IsUUID() nutritionistId?: string;

  @IsString() name!: string;
  @IsOptional() @IsString() description?: string;

  @IsOptional() @IsUUID() fileId?: string;
  @IsOptional() @IsString() pdfUrl?: string;

  @IsOptional() @IsDateString() validFrom?: string;
  @IsOptional() @IsDateString() validUntil?: string;

  @IsOptional() isActive?: boolean;

  @IsUUID() byUserId!: string;
}
