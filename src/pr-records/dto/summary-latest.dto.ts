import { IsUUID } from 'class-validator';

export class SummaryLatestDto {
  @IsUUID()
  gymId!: string;

  @IsUUID()
  clientId!: string;
}
