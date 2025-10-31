// src/gyms/gyms.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { GymsService } from './gyms.service';
import { CreateGymDto } from './dto/create-gym.dto';
import { UpdateGymDto } from './dto/update-gym.dto';
import { QueryGymsDto } from './dto/query-gyms.dto';

@Controller('api/gyms')
export class GymsController {
  constructor(private readonly gymsService: GymsService) {}

  @Post()
  create(@Body() dto: CreateGymDto) {
    return this.gymsService.create(dto);
  }

  @Get()
  findAll(@Query() qry: QueryGymsDto) {
    return this.gymsService.findAll(qry);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.gymsService.findOne(id);
  }

  @Get('slug/:slug')
  findBySlug(@Param('slug') slug: string) {
    return this.gymsService.findBySlug(slug);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateGymDto) {
    return this.gymsService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.gymsService.remove(id);
  }
}
