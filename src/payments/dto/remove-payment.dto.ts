// src/payments/dto/remove-payment.dto.ts
import { IsUUID } from 'class-validator';

export class RemovePaymentDto {
  @IsUUID()
  gymId!: string;

  @IsUUID()
  byUserId!: string; // ADMIN que elimina
}
