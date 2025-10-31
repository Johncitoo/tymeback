import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProgressPhotosService } from './progress-photos.service';
import { ProgressPhotosController } from './progress-photos.controller';
import { ProgressPhoto } from './entities/progress-photo.entity';
import { AppFile } from '../files/entities/file.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ProgressPhoto, AppFile])],
  controllers: [ProgressPhotosController],
  providers: [ProgressPhotosService],
  exports: [TypeOrmModule, ProgressPhotosService],
})
export class ProgressPhotosModule {}
