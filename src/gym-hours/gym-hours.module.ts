import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GymHour } from './entities/gym-hour.entity';
import { GymHourOverride } from './entities/gym-hour-override.entity';
import { User } from '../users/entities/user.entity';
import { GymHoursService } from './gym-hours.service';
import { GymHoursController } from './gym-hours.controller';

@Module({
  imports: [TypeOrmModule.forFeature([GymHour, GymHourOverride, User])],
  providers: [GymHoursService],
  controllers: [GymHoursController],
  exports: [TypeOrmModule, GymHoursService],
})
export class GymHoursModule {}
