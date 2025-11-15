import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ExercisesService } from './exercises.service';
import { CreateExerciseDto } from './dto/create-exercise.dto';
import { UpdateExerciseDto } from './dto/update-exercise.dto';
import { QueryExercisesDto } from './dto/query-exercises.dto';

@Controller('exercises')
export class ExercisesController {
  constructor(private readonly service: ExercisesService) {}

  @Post()
  create(@Body() dto: CreateExerciseDto) {
    return this.service.create(dto);
  }

  @Get()
  findAll(@Query() q: QueryExercisesDto) {
    return this.service.findAll(q);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Query('gymId') gymId: string) {
    return this.service.findOne(id, gymId);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Query('gymId') gymId: string,
    @Body() dto: UpdateExerciseDto,
  ) {
    return this.service.update(id, gymId, dto);
  }

  @Patch(':id/activate')
  activate(@Param('id') id: string, @Query('gymId') gymId: string) {
    return this.service.activate(id, gymId);
  }

  @Patch(':id/deactivate')
  deactivate(@Param('id') id: string, @Query('gymId') gymId: string) {
    return this.service.deactivate(id, gymId);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Query('gymId') gymId: string) {
    return this.service.remove(id, gymId);
  }
}
