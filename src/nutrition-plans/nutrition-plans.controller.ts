import { Body, Controller, Delete, Get, Param, Post, Put, Query } from '@nestjs/common';
import { NutritionPlansService } from './nutrition-plans.service';
import { CreateNutritionPlanDto } from './dto/create-nutrition-plan.dto';
import { UpdateNutritionPlanDto } from './dto/update-nutrition-plan.dto';
import { QueryNutritionPlansDto } from './dto/query-nutrition-plans.dto';

@Controller('api/nutrition/nutrition-plans')
export class NutritionPlansController {
  constructor(private readonly service: NutritionPlansService) {}

  @Post()
  create(@Body() dto: CreateNutritionPlanDto) {
    return this.service.create(dto);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateNutritionPlanDto) {
    return this.service.update(id, dto);
  }

  @Get()
  findAll(@Query() q: QueryNutritionPlansDto) {
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
