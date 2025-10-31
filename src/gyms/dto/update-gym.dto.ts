// src/gyms/dto/update-gym.dto.ts
import { PartialType } from '@nestjs/mapped-types';
import { CreateGymDto } from './create-gym.dto';
import { Transform } from 'class-transformer';
import { IsOptional, Matches } from 'class-validator';

export class UpdateGymDto extends PartialType(CreateGymDto) {
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.toLowerCase() : value))
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/i, {
    message:
      'slug inválido: use solo letras/números y guiones (ej: "tyme", "power-fit")',
  })
  slug?: string;
}
