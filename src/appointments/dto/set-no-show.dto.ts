import { IsUUID, IsOptional, IsString } from 'class-validator';

export class SetNoShowDto {
  @IsUUID() gymId!: string;
  @IsOptional() @IsString() note?: string;
}
