import { IsOptional, IsString, IsUUID, IsBoolean } from 'class-validator';

export class UpdateRoutineDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsUUID()
  createdByUserId?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
