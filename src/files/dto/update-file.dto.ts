import { IsEnum, IsOptional, IsString } from 'class-validator';
import { FilePurposeEnum, FileStatusEnum } from '../entities/file.entity';

export class UpdateFileDto {
  @IsOptional()
  @IsEnum(FilePurposeEnum)
  purpose?: FilePurposeEnum;

  @IsOptional()
  @IsEnum(FileStatusEnum)
  status?: FileStatusEnum;

  @IsOptional()
  @IsString()
  publicUrl?: string | null;
}
