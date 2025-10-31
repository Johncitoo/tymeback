import { IsOptional, IsString, IsUUID, IsBoolean } from 'class-validator';

export class CreateRoutineDto {
  @IsUUID()
  gymId!: string;

  @IsString()
  name!: string;

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
