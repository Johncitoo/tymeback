import { IsDateString, IsOptional, IsString, IsUUID } from 'class-validator';

export class AddMaintenanceDto {
  @IsUUID()
  gymId!: string;

  @IsDateString()
  performedAt!: string; // ISO

  @IsOptional()
  @IsUUID()
  performedByUserId?: string;

  @IsOptional()
  @IsString()
  note?: string;
}
