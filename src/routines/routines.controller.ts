import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
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
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('routines')
@UseGuards(JwtAuthGuard)
export class RoutinesController {
  constructor(private readonly service: RoutinesService) {}

  // ---- routines ----
  @Post()
  create(@Body() dto: CreateRoutineDto, @CurrentUser() user: any) {
    return this.service.createRoutine({ ...dto, gymId: user.gymId });
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateRoutineDto,
    @CurrentUser() user: any,
  ) {
    return this.service.updateRoutine(id, user.gymId, dto);
  }

  @Get()
  list(@Query() q: QueryRoutinesDto, @CurrentUser() user: any) {
    return this.service.listRoutines({ ...q, gymId: user.gymId });
  }

  // ---- assignments ---- (debe ir antes de @Get(':id'))
  @Get('assignments')
  listAssignments(@Query() q: QueryAssignmentsDto, @CurrentUser() user: any) {
    return this.service.listAssignments({ ...q, gymId: user.gymId });
  }

  @Get('assignments/:id')
  getAssignment(@Param('id') id: string, @CurrentUser() user: any) {
    return this.service.getAssignment(id, user.gymId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.service.findRoutine(id, user.gymId);
  }

  @Delete(':id')
  delete(@Param('id') id: string, @CurrentUser() user: any) {
    return this.service.deleteRoutine(id, user.gymId);
  }

  // ---- days ----
  @Post('days')
  addDay(@Body() dto: AddDayDto, @CurrentUser() user: any) {
    return this.service.addDay({ ...dto, gymId: user.gymId });
  }

  @Delete('days/:dayId')
  deleteDay(
    @Param('dayId') dayId: string,
    @CurrentUser() user: any,
  ) {
    return this.service.deleteDay(dayId, user.gymId);
  }

  // ---- day exercises ----
  @Post('day-exercises')
  addDayExercise(@Body() dto: AddExerciseDto, @CurrentUser() user: any) {
    return this.service.addExercise({ ...dto, gymId: user.gymId });
  }

  @Patch('days/:dayId/reorder')
  reorder(
    @Param('dayId') dayId: string,
    @Body() dto: ReorderDayExercisesDto,
    @CurrentUser() user: any,
  ) {
    return this.service.reorderDayExercises(dayId, user.gymId, dto);
  }

  // ---- assignments ----
  @Post('assign')
  assign(@Body() dto: AssignRoutineDto, @CurrentUser() user: any) {
    return this.service.assign(dto, user.gymId, user.sub);
  }

  @Patch('assignments/override')
  setOverride(@Body() dto: UpdateExerciseOverrideDto, @CurrentUser() user: any) {
    return this.service.setExerciseOverride(dto, user.gymId);
  }

  @Patch('assignments/:id/refresh-snapshot')
  refreshSnapshot(@Param('id') id: string, @CurrentUser() user: any) {
    return this.service.refreshSnapshot(id, user.gymId);
  }

  @Patch('assignments/:id/deactivate')
  deactivate(@Param('id') id: string, @CurrentUser() user: any) {
    return this.service.deactivateAssignment(id, user.gymId);
  }

  @Patch('assignments/:id/activate')
  activate(@Param('id') id: string, @CurrentUser() user: any) {
    return this.service.activateAssignment(id, user.gymId);
  }
}
