import { PartialType } from '@nestjs/mapped-types';
import { CreateAnamnesisDto } from './create-anamnesis.dto';
import { IsDateString, IsOptional, IsString, IsUUID } from 'class-validator';

export class UpdateAnamnesisDto extends PartialType(CreateAnamnesisDto) {
  @IsUUID()
  id!: string;

  @IsOptional()
  @IsUUID()
  gymId?: string;

  @IsDateString()
  @IsOptional()
  takenAt?: string;

  @IsString()
  @IsOptional()
  goals?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}
