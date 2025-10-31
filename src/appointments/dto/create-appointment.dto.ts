import { IsUUID, IsEnum, IsBoolean, IsOptional, IsISO8601, IsString } from 'class-validator';
import { AppointmentTypeEnum } from '../entities/appointment.entity';

export class CreateAppointmentDto {
  @IsUUID() gymId!: string;
  @IsEnum(AppointmentTypeEnum) type!: AppointmentTypeEnum;

  @IsUUID() clientId!: string;
  @IsUUID() staffId!: string;

  @IsISO8601() startAt!: string; // 2025-10-31T10:00:00-03:00
  @IsISO8601() endAt!: string;

  @IsOptional() @IsBoolean() requiresSession?: boolean;
  @IsOptional() @IsUUID() membershipId?: string;

  @IsUUID() createdByUserId!: string;

  @IsOptional() @IsString() notes?: string;
}
