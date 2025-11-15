import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class CreateTemplateDto {
  @IsString()
  name!: string;

  @IsString()
  subject!: string;

  @IsString()
  html!: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
