import { IsString, MinLength } from 'class-validator';

export class LoginDto {
  @IsString()
  gymSlug!: string; // Slug del gimnasio (ej: tyme-demo)

  @IsString()
  login!: string; // email o RUT

  @IsString()
  @MinLength(8)
  password!: string;
}
