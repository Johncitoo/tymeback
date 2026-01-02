import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, Matches, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { FilePurposeEnum } from '../entities/file.entity';

export class CreateUploadDto {
  @Matches(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)
  gymId!: string;

  @Matches(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)
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
