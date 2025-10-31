import { IsUUID, IsOptional, IsDateString, IsObject, IsString } from 'class-validator';

export class CreateInbodyDto {
  @IsUUID() gymId!: string;
  @IsUUID() clientId!: string;
  @IsOptional() @IsUUID() nutritionistId?: string;

  @IsOptional() @IsDateString() scanDate?: string;

  @IsOptional() @IsObject() data?: Record<string, any>;
  @IsOptional() @IsUUID() fileId?: string; // archivo PDF en files
  @IsOptional() @IsString() notes?: string;

  @IsUUID() byUserId!: string;
}
