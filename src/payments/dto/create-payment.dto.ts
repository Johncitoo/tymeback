import { IsUUID, IsEnum, IsInt, Min, IsOptional, IsString, IsDateString } from 'class-validator';
import { PaymentMethodEnum } from '../entities/payment.entity';

export class CreatePaymentDto {
  @IsUUID() gymId!: string;
  @IsUUID() clientId!: string;

  /** Plan a pagar (tu UI actual asume un plan por pago) */
  @IsUUID() planId!: string;

  @IsEnum(PaymentMethodEnum) method!: PaymentMethodEnum;

  /** ISO (timestamptz). Si es pasado, requiere backdatingReason */
  @IsDateString() paidAt!: string;

  /** opcional: comprobante (files.id) */
  @IsOptional() @IsUUID() receiptFileId?: string;

  @IsOptional() @IsString() backdatingReason?: string;
  @IsOptional() @IsString() note?: string;

  /** ADMIN que registra */
  @IsUUID() createdByUserId!: string;
}
