import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
// import { AppointmentsService } from './appointments.service'; // DESHABILITADO
// import { AppointmentsController } from './appointments.controller'; // DESHABILITADO
import { Appointment } from './entities/appointment.entity';
import { StaffAvailability } from './entities/staff-availability.entity';
import { StaffTimeOff } from './entities/staff-time-off.entity';
import { User } from '../users/entities/user.entity';
import { Membership } from '../memberships/entities/membership.entity';
import { GymHour } from '../gym-hours/entities/gym-hour.entity';
import { GymHourOverride } from '../gym-hours/entities/gym-hour-override.entity';
import { MembershipsModule } from '../memberships/memberships.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Appointment,
      StaffAvailability,
      StaffTimeOff,
      User,
      Membership,
      GymHour,
      GymHourOverride,
    ]),
    MembershipsModule,
  ],
  controllers: [], // AppointmentsController - DESHABILITADO
  providers: [], // AppointmentsService - DESHABILITADO
  exports: [TypeOrmModule], // Removido AppointmentsService
})
export class AppointmentsModule {}
