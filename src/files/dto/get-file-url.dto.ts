import { IsOptional, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class GetFileUrlDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(60)
  @Max(3600)
  expiresIn?: number = 600; // 10 minutos por defecto
}
