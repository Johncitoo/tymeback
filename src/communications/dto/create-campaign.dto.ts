import { IsString, IsOptional, IsJSON } from 'class-validator';

export class CreateCampaignDto {
  @IsString()
  subject!: string;

  @IsString()
  html!: string;

  @IsOptional()
  @IsJSON()
  filters?: string; // JSON string (se guarda como JSONB)
}
