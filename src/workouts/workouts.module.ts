import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WorkoutsService } from './workouts.service';
import { WorkoutsController } from './workouts.controller';
import { WorkoutSession } from './entities/workout-session.entity';
import { WorkoutEntry } from './entities/workout-entry.entity';
import { RoutineAssignment } from '../routines/entities/routine-assignment.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      WorkoutSession,
      WorkoutEntry,
      RoutineAssignment,
    ]),
  ],
  controllers: [WorkoutsController],
  providers: [WorkoutsService],
  exports: [TypeOrmModule, WorkoutsService],
})
export class WorkoutsModule {}
