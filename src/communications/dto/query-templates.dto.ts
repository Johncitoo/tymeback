import { IsOptional } from 'class-validator';

export class QueryTemplatesDto {
  @IsOptional()
  isActive?: string; // "true"/"false"
}
