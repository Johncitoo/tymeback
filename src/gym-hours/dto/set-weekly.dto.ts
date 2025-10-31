import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  ValidateNested,
} from 'class-validator';

class WeeklyItemDto {
  @IsIn([0,1,2,3,4,5,6])
  dayOfWeek!: number; // 0=domingo ... 6=sábado

  @IsBoolean()
  isOpen!: boolean;

  @IsOptional()
  @IsString()
  @Length(4, 5) // HH:mm (permite H:mm pero recomendamos 2 dígitos)
  openTime?: string;

  @IsOptional()
  @IsString()
  @Length(4, 5) // HH:mm
  closeTime?: string;
}

export class SetWeeklyDto {
  @IsUUID()
  gymId!: string;

  @IsArray()
  @ArrayMinSize(7)
  @ValidateNested({ each: true })
  @Type(() => WeeklyItemDto)
  days!: WeeklyItemDto[];
}
