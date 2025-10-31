import { IsUUID, IsISO8601, IsOptional, IsString } from 'class-validator';

export class RescheduleAppointmentDto {
  @IsUUID() gymId!: string;
  @IsISO8601() newStartAt!: string;
  @IsISO8601() newEndAt!: string;

  @IsOptional() @IsString() reason?: string;
}
