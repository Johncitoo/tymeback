import { IsInt, IsUUID, Max, Min } from 'class-validator';

export class StartSessionDto {
  @IsUUID()
  gymId!: string;

  @IsUUID()
  clientId!: string;

  @IsUUID()
  assignmentId!: string;

  @IsInt()
  @Min(1)
  @Max(7)
  dayIndex!: number;
}
