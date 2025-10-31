import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FilesService } from './files.service';
import { FilesController } from './files.controller';
import { AppFile } from './entities/file.entity';
import { User } from '../users/entities/user.entity';
import { GcsService } from './storage/gcs.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule, TypeOrmModule.forFeature([AppFile, User])],
  controllers: [FilesController],
  providers: [FilesService, GcsService],
  exports: [FilesService],
})
export class FilesModule {}
