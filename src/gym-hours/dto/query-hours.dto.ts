import { IsUUID, IsOptional, Matches } from 'class-validator';

export class QueryHoursDto {
  @IsUUID()
  gymId!: string;

  /** YYYY-MM-DD */
  @IsOptional() @Matches(/^\d{4}-\d{2}-\d{2}$/)
  date?: string;
}
