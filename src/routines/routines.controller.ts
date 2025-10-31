import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { RoutinesService } from './routines.service';
import { CreateRoutineDto } from './dto/create-routine.dto';
import { UpdateRoutineDto } from './dto/update-routine.dto';
import { QueryRoutinesDto } from './dto/query-routines.dto';
import { AddDayDto } from './dto/add-day.dto';
import { AddExerciseDto } from './dto/add-exercise.dto';
import { ReorderDayExercisesDto } from './dto/reorder-day-exercises.dto';
import { AssignRoutineDto } from './dto/assign-routine.dto';
import { UpdateExerciseOverrideDto } from './dto/update-exercise-override.dto';
import { QueryAssignmentsDto } from './dto/query-assignments.dto';

@Controller('api/routines')
export class RoutinesController {
  constructor(private readonly service: RoutinesService) {}

  // ---- routines ----
  @Post()
  create(@Body() dto: CreateRoutineDto) {
    return this.service.createRoutine(dto);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Query('gymId') gymId: string,
    @Body() dto: UpdateRoutineDto,
  ) {
    return this.service.updateRoutine(id, gymId, dto);
  }

  @Get()
  list(@Query() q: QueryRoutinesDto) {
    return this.service.listRoutines(q);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Query('gymId') gymId: string) {
    return this.service.findRoutine(id, gymId);
  }

  // ---- days ----
  @Post('days')
  addDay(@Body() dto: AddDayDto) {
    return this.service.addDay(dto);
  }

  // ---- day exercises ----
  @Post('day-exercises')
  addDayExercise(@Body() dto: AddExerciseDto) {
    return this.service.addExercise(dto);
  }

  @Patch('days/:dayId/reorder')
  reorder(
    @Param('dayId') dayId: string,
    @Query('gymId') gymId: string,
    @Body() dto: ReorderDayExercisesDto,
  ) {
    return this.service.reorderDayExercises(dayId, gymId, dto);
  }

  // ---- assignments ----
  @Post('assign')
  assign(@Body() dto: AssignRoutineDto) {
    return this.service.assign(dto);
  }

  @Get('assignments')
  listAssignments(@Query() q: QueryAssignmentsDto) {
    return this.service.listAssignments(q);
  }

  @Get('assignments/:id')
  getAssignment(@Param('id') id: string, @Query('gymId') gymId: string) {
    return this.service.getAssignment(id, gymId);
  }

  @Patch('assignments/override')
  setOverride(@Body() dto: UpdateExerciseOverrideDto) {
    return this.service.setExerciseOverride(dto);
  }

  @Patch('assignments/:id/deactivate')
  deactivate(@Param('id') id: string, @Query('gymId') gymId: string) {
    return this.service.deactivateAssignment(id, gymId);
  }

  @Patch('assignments/:id/activate')
  activate(@Param('id') id: string, @Query('gymId') gymId: string) {
    return this.service.activateAssignment(id, gymId);
  }
}
