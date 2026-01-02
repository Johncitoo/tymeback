import { Transform, Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Min,
} from 'class-validator';
import { FilePurposeEnum } from '../entities/file.entity';

export class RequestUploadDto {
  @Matches(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)
  gymId!: string;

  @IsOptional()
  @Matches(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)
  ownerUserId?: string;

  @IsEnum(FilePurposeEnum)
  purpose!: FilePurposeEnum;

  @IsString()
  originalFilename!: string;

  @IsString()
  mimeType!: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  sizeBytes!: number;

  @IsOptional()
  @Transform(({ value }) => (value === null ? undefined : value))
  sha256?: string;

  @IsOptional()
  @Transform(({ value }) => (value === null ? undefined : value))
  note?: string;
}
