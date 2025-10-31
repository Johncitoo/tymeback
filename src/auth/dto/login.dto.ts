import { IsString, IsUUID, MinLength } from 'class-validator';

export class LoginDto {
  @IsUUID()
  gymId!: string;

  @IsString()
  login!: string; // email o RUT

  @IsString()
  @MinLength(8)
  password!: string;
}
