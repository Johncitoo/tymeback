import { IsUUID, IsOptional, IsDateString, IsEnum, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { PaymentMethodEnum } from '../entities/payment.entity';

export class QueryPaymentsDto {
  @IsUUID() gymId!: string;
  @IsOptional() @IsUUID() clientId?: string;

  @IsOptional() @IsEnum(PaymentMethodEnum) method?: PaymentMethodEnum;

  @IsOptional() @IsDateString() dateFrom?: string;
  @IsOptional() @IsDateString() dateTo?: string;

  @IsOptional() @Type(() => Number) @IsInt() @Min(0) offset?: number = 0;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) limit?: number = 20;
}
