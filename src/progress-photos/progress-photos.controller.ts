import { Controller, Post, Body, Get, Query, Delete, Param } from '@nestjs/common';
import { ProgressPhotosService } from './progress-photos.service';
import { CreateProgressPhotoDto } from './dto/create-progress-photo.dto';
import { QueryProgressPhotosDto } from './dto/query-progress-photos.dto';

@Controller('progress-photos')
export class ProgressPhotosController {
  constructor(private readonly service: ProgressPhotosService) {}

  @Post()
  create(@Body() dto: CreateProgressPhotoDto) {
    return this.service.create(dto);
  }

  @Get()
  findAll(@Query() q: QueryProgressPhotosDto) {
    return this.service.findAll(q);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Query('gymId') gymId: string) {
    return this.service.remove(id, gymId);
  }
}
