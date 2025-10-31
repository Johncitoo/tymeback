import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { PrRecordsService } from './pr-records.service';
import { CreatePrDto } from './dto/create-pr.dto';
import { UpdatePrDto } from './dto/update-pr.dto';
import { QueryPrsDto } from './dto/query-prs.dto';
import { SummaryLatestDto } from './dto/summary-latest.dto';

@Controller('api/pr-records')
export class PrRecordsController {
  constructor(private readonly service: PrRecordsService) {}

  @Post()
  create(@Body() dto: CreatePrDto) {
    return this.service.create(dto);
  }

  @Get()
  findAll(@Query() q: QueryPrsDto) {
    return this.service.findAll(q);
  }

  @Get('by-exercise')
  byExercise(@Query() q: QueryPrsDto) {
    return this.service.byExercise(q);
  }

  @Get('summary/latest')
  latest(@Query() q: SummaryLatestDto) {
    return this.service.summaryLatest(q);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Query('gymId') gymId: string, @Body() dto: UpdatePrDto) {
    return this.service.update(id, gymId, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Query('gymId') gymId: string) {
    return this.service.remove(id, gymId);
  }
}
