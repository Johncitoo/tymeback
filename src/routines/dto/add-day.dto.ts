import { IsInt, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';

export class AddDayDto {
  @IsUUID()
  gymId!: string;

  @IsUUID()
  routineId!: string;

  @IsInt()
  @Min(1)
  @Max(7)
  dayIndex!: number;

  @IsOptional()
  @IsString()
  name?: string;
}
