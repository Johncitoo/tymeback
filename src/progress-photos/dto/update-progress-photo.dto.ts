import { PartialType } from '@nestjs/mapped-types';
import { CreateProgressPhotoDto } from './create-progress-photo.dto';

export class UpdateProgressPhotoDto extends PartialType(CreateProgressPhotoDto) {}
