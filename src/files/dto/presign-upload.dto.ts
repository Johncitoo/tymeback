import { IsUUID, IsString, IsInt, Min, IsOptional, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { FilePurposeEnum } from '../entities/file.entity';

export class PresignUploadDto {
  @IsUUID()
  gymId!: string;

  @IsOptional()
  @IsUUID()
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
