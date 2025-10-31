// src/gyms/dto/create-gym.dto.ts
import { Transform } from 'class-transformer';
import { IsOptional, IsString, Matches, MinLength } from 'class-validator';

export class CreateGymDto {
  @IsString()
  @MinLength(2)
  name!: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.toLowerCase() : value))
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/i, {
    message:
      'slug inválido: use solo letras/números y guiones (ej: "tyme", "power-fit")',
  })
  slug?: string;
}
