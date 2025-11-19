import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { NutritionPlansService } from './nutrition-plans.service';
import { CreateNutritionPlanDto } from './dto/create-nutrition-plan.dto';
import { UpdateNutritionPlanDto } from './dto/update-nutrition-plan.dto';
import { QueryNutritionPlansDto } from './dto/query-nutrition-plans.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

@Controller('nutrition-plans')
@UseGuards(JwtAuthGuard)
export class NutritionPlansController {
  constructor(private readonly service: NutritionPlansService) {}

  @Post()
  create(@Body() dto: CreateNutritionPlanDto, @CurrentUser() user: any) {
    return this.service.create({ ...dto, gymId: dto.gymId || user.gymId });
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateNutritionPlanDto, @CurrentUser() user: any) {
    return this.service.update(id, { ...dto, gymId: dto.gymId || user.gymId });
  }

  @Get()
  findAll(@Query() q: QueryNutritionPlansDto, @CurrentUser() user: any) {
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
