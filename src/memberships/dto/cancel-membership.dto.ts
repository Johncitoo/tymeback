import { IsUUID } from 'class-validator';

export class CancelMembershipDto {
  @IsUUID()
  gymId!: string;

  @IsUUID()
  byUserId!: string;
}
