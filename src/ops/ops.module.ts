import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OpsService } from './ops.service';
import { Attendance } from '../attendance/entities/attendance.entity';
import { GymHour } from '../gym-hours/entities/gym-hour.entity';
import { GymHourOverride } from '../gym-hours/entities/gym-hour-override.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Attendance, GymHour, GymHourOverride])],
  providers: [OpsService],
  exports: [],
})
export class OpsModule {}
