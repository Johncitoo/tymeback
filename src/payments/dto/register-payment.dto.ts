import { IsDateString, IsEnum, IsInt, IsOptional, IsString, IsUUID, Min } from 'class-validator';
import { PaymentMethodEnum } from '../entities/payment.entity';

export class RegisterPaymentDto {
  @IsUUID()
  gymId!: string;

  @IsUUID()
  clientId!: string;

  @IsEnum(PaymentMethodEnum)
  method!: PaymentMethodEnum;

  // Si no viene, se usa el precio del plan
  @IsOptional()
  @IsInt()
  @Min(0)
  amountClp?: number;

  @IsUUID()
  planId!: string;

  @IsOptional()
  @IsString()
  observation?: string;

  @IsOptional()
  @IsUUID()
  receiptFileId?: string;

  // Backdating hasta 7 días (solo ADMIN). Si no se permite, se ignora y se usa "now".
  @IsOptional()
  @IsDateString()
  paidAt?: string;

  // Para validar rol y autoría
  @IsUUID()
  byUserId!: string;
}
