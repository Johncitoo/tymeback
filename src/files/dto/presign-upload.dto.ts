import { Matches, IsString, IsInt, Min, IsOptional, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { FilePurposeEnum } from '../entities/file.entity';

export class PresignUploadDto {
  @Matches(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)
  gymId!: string;

  @IsOptional()
  @Matches(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)
  ownerUserId?: string; // p.ej. cliente, entrenador

  @IsString()
  fileName!: string;

  @IsString()
  contentType!: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  contentLength!: number; // bytes

  @IsOptional()
  @IsString()
  folder?: string; // subcarpeta opcional (ej: 'avatars', 'proofs')

  @IsOptional()
  @IsEnum(FilePurposeEnum)
  purpose?: FilePurposeEnum;
}
