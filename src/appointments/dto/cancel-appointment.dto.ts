import { IsUUID, IsOptional, IsString } from 'class-validator';

export class CancelAppointmentDto {
  @IsUUID() gymId!: string;
  @IsUUID() byUserId!: string;

  @IsOptional() @IsString() reason?: string;
}
