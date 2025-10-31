// src/clients/dto/emergency-contact.dto.ts
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class EmergencyContactDto {
  @IsString()
  @MinLength(2)
  fullName!: string;

  @IsString()
  @IsNotEmpty()
  phone!: string;

  @IsString()
  @IsNotEmpty()
  relation!: string;
}
