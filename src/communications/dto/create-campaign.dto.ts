import { IsJSON, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateCampaignDto {
  @IsUUID()
  gymId!: string;

  @IsString()
  name!: string;

  @IsString()
  subject!: string;

  @IsString()
  html!: string;

  @IsOptional()
  @IsJSON()
  filters?: string; // JSON string (se guarda como JSONB)

  @IsUUID()
  createdByUserId!: string;
}
