import { IsOptional, IsUUID } from 'class-validator';

export class QueryCampaignsDto {
  @IsUUID()
  gymId!: string;

  @IsOptional()
  status?: string;
}
