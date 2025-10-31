import { IsUUID, IsOptional, IsString } from 'class-validator';

export class CheckOutDto {
  @IsUUID() gymId!: string;
  @IsOptional() @IsString() note?: string;

  @IsUUID() byUserId!: string;
}
