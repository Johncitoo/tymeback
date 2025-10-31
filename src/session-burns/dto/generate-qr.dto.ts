import { Transform } from 'class-transformer';
import { IsOptional, IsString, IsUUID } from 'class-validator';

export class GenerateQrDto {
  @IsUUID()
  gymId!: string;

  @IsUUID()
  clientId!: string;

  // ADMIN/TRAINER que genera el QR
  @IsUUID()
  createdByUserId!: string;

  // Opcional: fijar membresía; si no, se usa la activa
  @IsOptional()
  @IsUUID()
  membershipId?: string;

  @IsOptional()
  @Transform(({ value }) => (value === null ? undefined : value))
  @IsString()
  note?: string;
}
