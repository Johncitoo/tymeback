import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BodyEvaluationsService } from './body-evaluations.service';
import { BodyEvaluationsController } from './body-evaluations.controller';
import { BodyEvaluation } from './entities/body-evaluation.entity';
import { User } from '../users/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([BodyEvaluation, User])],
  controllers: [BodyEvaluationsController],
  providers: [BodyEvaluationsService],
  exports: [TypeOrmModule, BodyEvaluationsService],
})
export class BodyEvaluationsModule {}
