import { IsInt, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';

export class AddDayDto {
  @IsOptional()
  @IsUUID('all')
  gymId?: string;

  @IsUUID('all')
  routineId!: string;

  @IsInt()
  @Min(1)
  @Max(7)
  dayIndex!: number;

  @IsOptional()
  @IsString()
  name?: string;
}
