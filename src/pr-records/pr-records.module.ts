import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PrRecordsService } from './pr-records.service';
import { PrRecordsController } from './pr-records.controller';
import { PrRecord } from './entities/pr-record.entity';
import { User } from '../users/entities/user.entity';
import { GymUser } from '../gym-users/entities/gym-user.entity';
import { Exercise } from '../exercises/entities/exercise.entity';

@Module({
  imports: [TypeOrmModule.forFeature([PrRecord, User, GymUser, Exercise])],
  controllers: [PrRecordsController],
  providers: [PrRecordsService],
  exports: [TypeOrmModule, PrRecordsService],
})
export class PrRecordsModule {}
