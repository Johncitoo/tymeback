import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Attendance } from './entities/attendance.entity';
import { AttendanceService } from './attendance.service';
import { AttendanceController } from './attendance.controller';
import { User } from '../users/entities/user.entity';
import { GymUser } from '../gym-users/entities/gym-user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Attendance, User, GymUser])],
  providers: [AttendanceService],
  controllers: [AttendanceController],
  exports: [TypeOrmModule, AttendanceService],
})
export class AttendanceModule {}
