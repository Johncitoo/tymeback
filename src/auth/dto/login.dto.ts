import { IsString, Matches, MinLength } from 'class-validator';

export class LoginDto {
  @IsString()
  @Matches(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, {
    message: 'gymId must be a valid UUID'
  })
  gymId!: string;

  @IsString()
  login!: string; // email o RUT

  @IsString()
  @MinLength(8)
  password!: string;
}
