import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';
import { PaymentMethodEnum } from '../entities/payment.entity';

export class UpdatePaymentDto {
  @IsOptional()
  @IsEnum(PaymentMethodEnum)
  method?: PaymentMethodEnum;

  @IsOptional()
  @IsDateString()
  paidAt?: string; // si se modifica hacia atrás > 0 días, requiere reason y ADMIN

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  overrideAmountClp?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(100)
  vatPercent?: number;

  @IsOptional()
  @IsString()
  backdatingReason?: string;

  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional()
  @IsUUID()
  receiptFileId?: string;
}
