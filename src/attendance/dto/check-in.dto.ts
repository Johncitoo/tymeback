import { IsUUID, IsOptional, IsString } from 'class-validator';

export class CheckInDto {
  @IsUUID() gymId!: string;
  @IsUUID() clientId!: string;
  @IsOptional() @IsString() note?: string;

  /** quién ejecuta (ADMIN/TRAINER o el propio CLIENT si UI lo permite) */
  @IsUUID() byUserId!: string;
}
