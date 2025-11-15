import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { PlansService } from './plans.service';
import { CreatePlanDto } from './dto/create-plan.dto';
import { UpdatePlanDto } from './dto/update-plan.dto';

@Controller('plans')
export class PlansController {
  constructor(private readonly service: PlansService) {}

  @Post()
  create(@Body() dto: CreatePlanDto) {
    return this.service.create(dto);
  }

  @Get()
  list(@Query('gymId') gymId: string, @Query('q') q?: string) {
    return this.service.findAll(gymId, q);
  }

  @Get(':id')
  get(@Param('id') id: string, @Query('gymId') gymId: string) {
    return this.service.findOne(id, gymId);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Query('gymId') gymId: string, @Body() dto: UpdatePlanDto) {
    return this.service.update(id, gymId, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Query('gymId') gymId: string) {
    return this.service.remove(id, gymId);
  }
}
