import { IsUUID, IsBoolean, IsOptional, IsString, Matches } from 'class-validator';

export class CreateOverrideDto {
  @IsUUID()
  gymId!: string;

  /** YYYY-MM-DD */
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  date!: string;

  @IsBoolean()
  isClosed!: boolean;

  /** HH:mm si isClosed=false */
  @IsOptional() @Matches(/^\d{2}:\d{2}$/)
  openTime?: string;

  /** HH:mm si isClosed=false */
  @IsOptional() @Matches(/^\d{2}:\d{2}$/)
  closeTime?: string;

  /** Motivo del override (feriado, mantención, etc.) */
  @IsOptional() @IsString()
  reason?: string;

  @IsUUID()
  byUserId!: string;
}
