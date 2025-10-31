import { IsUUID } from 'class-validator';

export class ConsumeSessionDto {
  @IsUUID()
  gymId!: string;

  @IsUUID()
  byUserId!: string;
}
