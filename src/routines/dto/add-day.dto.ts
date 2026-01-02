import { IsInt, IsOptional, IsString, Matches, Max, Min } from 'class-validator';

export class AddDayDto {
  @IsOptional()
  @Matches(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)
  gymId?: string;

  @Matches(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)
  routineId!: string;

  @IsInt()
  @Min(1)
  @Max(7)
  dayIndex!: number;

  @IsOptional()
  @IsString()
  name?: string;
}
