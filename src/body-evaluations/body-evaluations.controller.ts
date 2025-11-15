import { Body, Controller, Delete, Get, Param, Post, Put, Query } from '@nestjs/common';
import { BodyEvaluationsService } from './body-evaluations.service';
import { CreateBodyEvaluationDto } from './dto/create-body-evaluation.dto';
import { UpdateBodyEvaluationDto } from './dto/update-body-evaluation.dto';
import { QueryBodyEvaluationsDto } from './dto/query-body-evaluations.dto';

@Controller('nutrition/body-evaluations')
export class BodyEvaluationsController {
  constructor(private readonly service: BodyEvaluationsService) {}

  @Post()
  create(@Body() dto: CreateBodyEvaluationDto) {
    return this.service.create(dto);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateBodyEvaluationDto) {
    return this.service.update(id, dto);
  }

  @Get()
  findAll(@Query() q: QueryBodyEvaluationsDto) {
    return this.service.findAll(q);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Query('gymId') gymId: string) {
    return this.service.findOne(id, gymId);
  }

  @Delete(':id')
  remove(
    @Param('id') id: string,
    @Query('gymId') gymId: string,
    @Query('byUserId') byUserId: string,
  ) {
    return this.service.remove(id, gymId, byUserId);
  }
}
