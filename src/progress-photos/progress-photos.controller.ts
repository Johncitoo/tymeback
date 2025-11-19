import { Controller, Post, Body, Get, Query, Delete, Param, UseGuards } from '@nestjs/common';
import { ProgressPhotosService } from './progress-photos.service';
import { CreateProgressPhotoDto } from './dto/create-progress-photo.dto';
import { QueryProgressPhotosDto } from './dto/query-progress-photos.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

@Controller('progress-photos')
@UseGuards(JwtAuthGuard)
export class ProgressPhotosController {
  constructor(private readonly service: ProgressPhotosService) {}

  @Post()
  create(@Body() dto: CreateProgressPhotoDto, @CurrentUser() user: any) {
    return this.service.create({ ...dto, gymId: dto.gymId || user.gymId });
  }

  @Get()
  findAll(@Query() q: QueryProgressPhotosDto, @CurrentUser() user: any) {
    return this.service.findAll({ ...q, gymId: q.gymId || user.gymId });
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Query('gymId') gymId: string) {
    return this.service.remove(id, gymId);
  }
}
