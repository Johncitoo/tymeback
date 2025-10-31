import { IsEnum, IsInt, IsOptional, IsUUID, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { FilePurposeEnum, FileStatusEnum } from '../entities/file.entity';

export class QueryFilesDto {
  @IsUUID()
  gymId!: string;

  @IsUUID()
  @IsOptional()
  ownerUserId?: string;

  @IsOptional()
  @IsEnum(FilePurposeEnum)
  purpose?: FilePurposeEnum;

  @IsOptional()
  @IsEnum(FileStatusEnum)
  status?: FileStatusEnum;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  @IsOptional()
  offset?: number = 0;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  limit?: number = 20;
}
