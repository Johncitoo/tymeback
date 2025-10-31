import { IsUUID } from 'class-validator';

export class SoftDeletePaymentDto {
  @IsUUID()
  gymId!: string;

  @IsUUID()
  byUserId!: string;
}
