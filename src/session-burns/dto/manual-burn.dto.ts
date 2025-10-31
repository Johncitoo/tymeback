import { Transform } from 'class-transformer';
import { IsOptional, IsString, IsUUID } from 'class-validator';

export class ManualBurnDto {
  @IsUUID()
  gymId!: string;

  @IsUUID()
  clientId!: string;

  // ADMIN/TRAINER que quema manualmente
  @IsUUID()
  burnedByUserId!: string;

  @IsOptional()
  @IsUUID()
  membershipId?: string;

  @IsOptional()
  @Transform(({ value }) => (value === null ? undefined : value))
  @IsString()
  note?: string;
}
