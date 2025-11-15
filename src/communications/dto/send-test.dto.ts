import { IsEmail, IsString } from 'class-validator';

export class SendTestDto {
  @IsEmail()
  to!: string;

  @IsString()
  subject!: string;

  @IsString()
  html!: string;
}
