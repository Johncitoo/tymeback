import { IsUUID, IsInt, Min, IsOptional } from 'class-validator';

export class UseSessionsDto {
  @IsUUID() gymId!: string;
  @IsInt() @Min(1) count!: number;

  @IsOptional()
  note?: string;
}
