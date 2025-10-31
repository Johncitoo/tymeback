import { IsEmail, IsString, IsUUID } from 'class-validator';

export class SendTestDto {
  @IsUUID()
  gymId!: string;

  @IsEmail()
  to!: string;

  @IsString()
  subject!: string;

  @IsString()
  html!: string;
}
