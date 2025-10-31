import { IsUUID, IsBoolean, IsInt, Min, Max, IsOptional, Matches } from 'class-validator';

export class UpsertHourDto {
  @IsUUID()
  gymId!: string;

  /** 1=Lunes .. 7=Domingo (coincide con DB) */
  @IsInt() @Min(1) @Max(7)
  weekday!: number;

  @IsBoolean()
  isClosed!: boolean;

  /** Requerido si isClosed=false — formato HH:mm */
  @IsOptional() @Matches(/^\d{2}:\d{2}$/)
  openTime?: string;

  /** Requerido si isClosed=false — formato HH:mm */
  @IsOptional() @Matches(/^\d{2}:\d{2}$/)
  closeTime?: string;

  @IsUUID()
  byUserId!: string;
}
