import { IsOptional } from 'class-validator';

export class QueryCampaignsDto {
  @IsOptional()
  status?: string;
}
