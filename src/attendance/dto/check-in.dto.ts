import { Matches, IsOptional, IsString } from 'class-validator';

export class CheckInDto {
  @Matches(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, {
    message: 'gymId must be a valid UUID format',
  })
  gymId!: string;
  
  @Matches(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, {
    message: 'clientId must be a valid UUID format',
  })
  clientId!: string;
  
  @IsOptional() @IsString() note?: string;

  /** quién ejecuta (ADMIN/TRAINER o el propio CLIENT si UI lo permite) */
  @Matches(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, {
    message: 'byUserId must be a valid UUID format',
  })
  byUserId!: string;
}
