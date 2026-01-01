import { IsBoolean, IsOptional, IsUUID } from 'class-validator';

export class CompleteUploadDto {
  @IsUUID('all')
  gymId!: string;

  @IsUUID('all')
  fileId!: string;

  @IsOptional()
  @IsBoolean()
  makePublic?: boolean; // si true -> file.makePublic() y set publicUrl
}
