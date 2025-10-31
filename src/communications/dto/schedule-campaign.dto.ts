import { IsDateString, IsUUID } from 'class-validator';

export class ScheduleCampaignDto {
  @IsUUID()
  gymId!: string;

  @IsDateString()
  scheduledAt!: string; // ISO
}
