// src/attendance/dto/force-checkout.dto.ts
import { IsOptional, IsString, IsUUID } from 'class-validator';

export class ForceCheckoutDto {
  @IsUUID()
  gymId!: string;

  @IsUUID()
  byUserId!: string;

  @IsOptional()
  @IsString()
  note?: string;
}
