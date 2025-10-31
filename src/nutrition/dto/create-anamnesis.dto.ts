import { IsUUID, IsOptional, IsDateString, IsString, IsObject } from 'class-validator';

export class CreateAnamnesisDto {
  @IsUUID() gymId!: string;
  @IsUUID() clientId!: string;
  @IsOptional() @IsUUID() nutritionistId?: string;

  @IsOptional() @IsDateString() takenAt?: string;

  @IsOptional() @IsObject() lifestyle?: Record<string, any>;
  @IsOptional() @IsObject() clinical?: Record<string, any>;
  @IsOptional() @IsString() goals?: string;
  @IsOptional() @IsString() notes?: string;

  // control
  @IsUUID() byUserId!: string;
}
