import { IsUUID, IsOptional, IsEnum, IsISO8601, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { AppointmentStatusEnum, AppointmentTypeEnum } from '../entities/appointment.entity';

export class QueryAppointmentsDto {
  @IsUUID() gymId!: string;

  @IsOptional() @IsUUID() staffId?: string;
  @IsOptional() @IsUUID() clientId?: string;

  @IsOptional() @IsEnum(AppointmentStatusEnum) status?: AppointmentStatusEnum;
  @IsOptional() @IsEnum(AppointmentTypeEnum) type?: AppointmentTypeEnum;

  @IsOptional() @IsISO8601() dateFrom?: string;
  @IsOptional() @IsISO8601() dateTo?: string;

  @IsOptional() @Type(() => Number) @IsInt() @Min(0) offset?: number = 0;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) limit?: number = 20;
}
