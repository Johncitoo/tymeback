import { IsUUID } from 'class-validator';

export class GetActiveDto {
  @IsUUID()
  gymId!: string;

  @IsUUID()
  clientId!: string;
}
