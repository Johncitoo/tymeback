import { IsUUID, IsOptional, IsDateString, IsString, Length } from 'class-validator';

export class CreateProgressPhotoDto {
  @IsUUID()
  gymId!: string;

  @IsUUID()
  clientId!: string;

  @IsUUID()
  fileId!: string; // debe existir en files y estar READY

  @IsOptional()
  @IsDateString()
  takenAt?: string;

  @IsOptional()
  @IsString()
  @Length(0, 500)
  note?: string;
}
