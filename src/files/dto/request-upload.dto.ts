import { Transform, Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';
import { FilePurposeEnum } from '../entities/file.entity';

export class RequestUploadDto {
  @IsUUID('all')
  gymId!: string;

  @IsOptional()
  @IsUUID('all')
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
