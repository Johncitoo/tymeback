import { Matches, IsDateString, IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { PaymentMethodEnum } from '../entities/payment.entity';

export class RegisterPaymentDto {
  @Matches(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)
  gymId!: string;

  @Matches(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)
  clientId!: string;

  @IsEnum(PaymentMethodEnum)
  method!: PaymentMethodEnum;

  // Si no viene, se usa el precio del plan
  @IsOptional()
  @IsInt()
  @Min(0)
  amountClp?: number;

  @Matches(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)
  planId!: string;

  @IsOptional()
  @IsString()
  observation?: string;

  @IsOptional()
  @Matches(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)
  receiptFileId?: string;

  // Backdating hasta 7 días (solo ADMIN). Si no se permite, se ignora y se usa "now".
  @IsOptional()
  @IsDateString()
  paidAt?: string;

  // Para validar rol y autoría
  @Matches(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)
  byUserId!: string;
}
