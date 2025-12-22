import { IsString, IsEnum, IsOptional, MaxLength, IsBoolean, IsArray, IsUUID } from 'class-validator';
import { AutomatedEmailType } from '../entities/automated-email-template.entity';

export class UpdateAutomatedEmailDto {
  @IsString()
  @MaxLength(200)
  subject: string;

  @IsString()
  contentBody: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class SendMassEmailDto {
  @IsString()
  @MaxLength(200)
  subject: string;

  @IsString()
  contentBody: string;

  @IsEnum(['ALL_USERS', 'ALL_ACTIVE', 'ALL_INACTIVE', 'SPECIFIC_USERS', 'BY_MEMBERSHIP', 'BY_GENDER', 'CUSTOM'])
  filterType: string;

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  userIds?: string[];

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  membershipIds?: string[];

  @IsOptional()
  @IsString()
  gender?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsUUID('4')
  templateId?: string; // ID de plantilla si se usa una predefinida
}
