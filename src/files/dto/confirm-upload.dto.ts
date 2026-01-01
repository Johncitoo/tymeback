import { IsUUID } from 'class-validator';

export class ConfirmUploadDto {
  @IsUUID('all')
  gymId!: string;

  @IsUUID('all')
  fileId!: string;
}
