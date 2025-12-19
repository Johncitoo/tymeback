import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ExercisesService } from './exercises.service';
import { CreateExerciseDto } from './dto/create-exercise.dto';
import { UpdateExerciseDto } from './dto/update-exercise.dto';
import { QueryExercisesDto } from './dto/query-exercises.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { JwtUser } from '../auth/current-user.decorator';

@Controller('exercises')
@UseGuards(JwtAuthGuard)
export class ExercisesController {
  constructor(private readonly service: ExercisesService) {}

  @Post()
  create(@Body() dto: CreateExerciseDto, @CurrentUser() user: JwtUser) {
    return this.service.create({ ...dto, gymId: user.gymId });
  }

  @Get()
  findAll(@Query() q: QueryExercisesDto, @CurrentUser() user: JwtUser) {
    return this.service.findAll({ ...q, gymId: user.gymId });
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: JwtUser) {
    return this.service.findOne(id, user.gymId);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateExerciseDto,
    @CurrentUser() user: JwtUser,
  ) {
    return this.service.update(id, user.gymId, dto);
  }

  @Patch(':id/activate')
  activate(@Param('id') id: string, @CurrentUser() user: JwtUser) {
    return this.service.activate(id, user.gymId);
  }

  @Patch(':id/deactivate')
  deactivate(@Param('id') id: string, @CurrentUser() user: JwtUser) {
    return this.service.deactivate(id, user.gymId);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: JwtUser) {
    return this.service.remove(id, user.gymId);
  }
}
