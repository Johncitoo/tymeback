import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExercisesService } from './exercises.service';
import { ExercisesController } from './exercises.controller';
import { Exercise } from './entities/exercise.entity';
import { Machine } from '../machines/entities/machine.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Exercise, Machine])],
  controllers: [ExercisesController],
  providers: [ExercisesService],
  exports: [TypeOrmModule, ExercisesService],
})
export class ExercisesModule {}
