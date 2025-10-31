import { IsString, IsUUID } from 'class-validator';

export class RedeemQrDto {
  @IsUUID()
  gymId!: string;

  @IsUUID()
  clientId!: string; // cliente que escanea

  @IsString()
  token!: string;
}
