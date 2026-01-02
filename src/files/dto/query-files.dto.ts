import { IsEnum, IsInt, IsOptional, Matches, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { FilePurposeEnum, FileStatusEnum } from '../entities/file.entity';

export class QueryFilesDto {
  @Matches(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)
  gymId!: string;

  @IsOptional()
  @Matches(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)
  ownerGymUserId?: string;

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
