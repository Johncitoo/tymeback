import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { TemplatePurposeEnum } from '../entities/email-template.entity';

export class QueryTemplatesDto {
  @IsUUID()
  gymId!: string;

  @IsOptional()
  @IsEnum(TemplatePurposeEnum)
  purpose?: TemplatePurposeEnum;

  @IsOptional()
  isActive?: string; // "true"/"false"
}
