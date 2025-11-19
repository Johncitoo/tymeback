import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { BodyEvaluationsService } from './body-evaluations.service';
import { CreateBodyEvaluationDto } from './dto/create-body-evaluation.dto';
import { UpdateBodyEvaluationDto } from './dto/update-body-evaluation.dto';
import { QueryBodyEvaluationsDto } from './dto/query-body-evaluations.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

@Controller('body-evaluations')
@UseGuards(JwtAuthGuard)
export class BodyEvaluationsController {
  constructor(private readonly service: BodyEvaluationsService) {}

  @Post()
  create(@Body() dto: CreateBodyEvaluationDto, @CurrentUser() user: any) {
    return this.service.create({ ...dto, gymId: dto.gymId || user.gymId });
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateBodyEvaluationDto, @CurrentUser() user: any) {
    return this.service.update(id, { ...dto, gymId: dto.gymId || user.gymId });
  }

  @Get()
  findAll(@Query() q: QueryBodyEvaluationsDto, @CurrentUser() user: any) {
    return this.service.findAll({ ...q, gymId: q.gymId || user.gymId });
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Query('gymId') gymId: string, @CurrentUser() user: any) {
    return this.service.findOne(id, gymId || user.gymId);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Query('gymId') gymId: string, @CurrentUser() user: any) {
    return this.service.remove(id, gymId || user.gymId, user.sub);
  }
}
