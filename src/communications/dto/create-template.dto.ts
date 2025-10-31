import { IsBoolean, IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { TemplatePurposeEnum } from '../entities/email-template.entity';

export class CreateTemplateDto {
  @IsUUID()
  gymId!: string;

  @IsString()
  name!: string;

  @IsString()
  subject!: string;

  @IsString()
  html!: string;

  @IsOptional()
  @IsEnum(TemplatePurposeEnum)
  purpose?: TemplatePurposeEnum;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
