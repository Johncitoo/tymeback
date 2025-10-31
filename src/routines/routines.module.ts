import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RoutinesService } from './routines.service';
import { RoutinesController } from './routines.controller';
import { Routine } from './entities/routine.entity';
import { RoutineDay } from './entities/routine-day.entity';
import { RoutineDayExercise } from './entities/routine-day-exercise.entity';
import { RoutineAssignment } from './entities/routine-assignment.entity';
import { Exercise } from '../exercises/entities/exercise.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Routine,
      RoutineDay,
      RoutineDayExercise,
      RoutineAssignment,
      Exercise,
    ]),
  ],
  controllers: [RoutinesController],
  providers: [RoutinesService],
  exports: [TypeOrmModule, RoutinesService],
})
export class RoutinesModule {}
