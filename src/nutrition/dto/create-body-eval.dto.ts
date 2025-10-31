import { IsUUID, IsOptional, IsDateString, IsObject, IsString } from 'class-validator';

export class CreateBodyEvalDto {
  @IsUUID() gymId!: string;
  @IsUUID() clientId!: string;
  @IsOptional() @IsUUID() nutritionistId?: string;

  @IsOptional() @IsDateString() measuredAt?: string;
  @IsObject() data!: Record<string, any>;
  @IsOptional() @IsString() notes?: string;

  @IsUUID() byUserId!: string;
}
