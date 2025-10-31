import { IsUUID } from 'class-validator';

export class AttachReceiptDto {
  @IsUUID() gymId!: string;
  @IsUUID() byUserId!: string;
  @IsUUID() fileId!: string; // files.id (AppFile)
}
