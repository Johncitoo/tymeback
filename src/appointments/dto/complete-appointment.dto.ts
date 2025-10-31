import { IsUUID, IsOptional, IsString } from 'class-validator';

export class CompleteAppointmentDto {
  @IsUUID() gymId!: string;
  @IsOptional() @IsUUID() membershipId?: string;

  @IsOptional() @IsString() note?: string;
}
