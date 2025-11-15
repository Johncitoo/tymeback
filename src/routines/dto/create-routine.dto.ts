import { IsOptional, IsString, Matches, IsBoolean } from 'class-validator';

export class CreateRoutineDto {
  @Matches(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, {
    message: 'gymId must be a valid UUID format',
  })
  gymId!: string;

  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @Matches(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, {
    message: 'createdByUserId must be a valid UUID format',
  })
  createdByUserId?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
