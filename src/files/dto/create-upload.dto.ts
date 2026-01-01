import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { FilePurposeEnum } from '../entities/file.entity';

export class CreateUploadDto {
  @IsUUID('all')
  gymId!: string;

  @IsUUID('all')
  @IsOptional()
  ownerUserId?: string;

  @IsString()
  @IsNotEmpty()
  originalName!: string;

  @IsString()
  @IsNotEmpty()
  mimeType!: string; // se valida contra whitelist en service

  @Type(() => Number)
  @IsInt()
  @Min(1)
  // Max real se valida en service usando config; este Max evita valores absurdos:
  @Max(1_000_000_000)
  sizeBytes!: number;

  @IsEnum(FilePurposeEnum)
  purpose!: FilePurposeEnum;
}
