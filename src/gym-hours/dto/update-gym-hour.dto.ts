import { PartialType } from '@nestjs/mapped-types';
import { CreateGymHourDto } from './create-gym-hour.dto';

export class UpdateGymHourDto extends PartialType(CreateGymHourDto) {}
