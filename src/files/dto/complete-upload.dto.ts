import { IsBoolean, IsOptional, Matches } from 'class-validator';

export class CompleteUploadDto {
  @Matches(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)
  gymId!: string;

  @Matches(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)
  fileId!: string;

  @IsOptional()
  @IsBoolean()
  makePublic?: boolean; // si true -> file.makePublic() y set publicUrl
}
