import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { PlansService } from './plans.service';
import { CreatePlanDto } from './dto/create-plan.dto';
import { UpdatePlanDto } from './dto/update-plan.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { JwtUser } from '../auth/current-user.decorator';

@Controller('plans')
@UseGuards(JwtAuthGuard)
export class PlansController {
  constructor(private readonly service: PlansService) {}

  @Post()
  create(@Body() dto: CreatePlanDto, @CurrentUser() user: JwtUser) {
    return this.service.create({ ...dto, gymId: user.gymId });
  }

  @Get()
  list(@Query('q') q: string | undefined, @CurrentUser() user: JwtUser) {
    return this.service.findAll(user.gymId, q);
  }

  @Get(':id')
  get(@Param('id') id: string, @CurrentUser() user: JwtUser) {
    return this.service.findOne(id, user.gymId);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdatePlanDto, @CurrentUser() user: JwtUser) {
    return this.service.update(id, user.gymId, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: JwtUser) {
    return this.service.remove(id, user.gymId);
  }
}
