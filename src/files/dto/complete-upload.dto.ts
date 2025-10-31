import { IsBoolean, IsOptional, IsUUID } from 'class-validator';

export class CompleteUploadDto {
  @IsUUID()
  gymId!: string;

  @IsUUID()
  fileId!: string;

  @IsOptional()
  @IsBoolean()
  makePublic?: boolean; // si true -> file.makePublic() y set publicUrl
}
