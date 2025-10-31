import { IsUUID } from 'class-validator';

export class ConfirmUploadDto {
  @IsUUID()
  gymId!: string;

  @IsUUID()
  fileId!: string;
}
