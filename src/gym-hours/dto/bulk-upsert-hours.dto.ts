import { Type } from 'class-transformer';
import { ValidateNested, ArrayMinSize } from 'class-validator';
import { UpsertHourDto } from './upsert-hour.dto';

export class BulkUpsertHoursDto {
  @ValidateNested({ each: true })
  @Type(() => UpsertHourDto)
  @ArrayMinSize(1)
  items!: UpsertHourDto[];
}
