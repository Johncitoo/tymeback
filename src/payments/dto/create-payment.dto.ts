import { IsEnum, IsInt, Min, IsOptional, IsString, IsDateString, Matches } from 'class-validator';
import { PaymentMethodEnum } from '../entities/payment.entity';

export class CreatePaymentDto {
  @Matches(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, {
    message: 'gymId must be a valid UUID format'
  })
  gymId!: string;

  @Matches(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, {
    message: 'clientId must be a valid UUID format'
  })
  clientId!: string;

  /** Plan a pagar (tu UI actual asume un plan por pago) */
  @Matches(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, {
    message: 'planId must be a valid UUID format'
  })
  planId!: string;

  @IsEnum(PaymentMethodEnum) method!: PaymentMethodEnum;

  /** ISO (timestamptz). Si es pasado, requiere backdatingReason */
  @IsDateString() paidAt!: string;

  /** opcional: comprobante (files.id) */
  @IsOptional()
  @Matches(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, {
    message: 'receiptFileId must be a valid UUID format'
  })
  receiptFileId?: string;

  @IsOptional() @IsString() backdatingReason?: string;
  @IsOptional() @IsString() note?: string;

  /** ADMIN que registra */
  @Matches(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, {
    message: 'createdByUserId must be a valid UUID format'
  })
  createdByUserId!: string;
}
