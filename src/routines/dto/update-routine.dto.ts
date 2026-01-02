import { IsOptional, IsString, Matches, IsBoolean } from 'class-validator';

export class UpdateRoutineDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @Matches(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)
  createdByUserId?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
