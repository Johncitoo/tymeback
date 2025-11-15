import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { WorkoutsService } from './workouts.service';
import { StartSessionDto } from './dto/start-session.dto';
import { ToggleEntryDto } from './dto/toggle-entry.dto';
import { QuerySessionsDto } from './dto/query-sessions.dto';

@Controller('workouts')
export class WorkoutsController {
  constructor(private readonly service: WorkoutsService) {}

  // Crear/obtener la sesión de la semana para un día y generar entradas
  @Post('sessions/start')
  start(@Body() dto: StartSessionDto) {
    return this.service.startSession(dto);
  }

  // Obtener una sesión (con entries)
  @Get('sessions/:id')
  get(@Param('id') id: string, @Query('gymId') gymId: string) {
    return this.service.getSession(id, gymId);
  }

  // Listar sesiones del cliente en la semana (opcionalmente por día)
  @Get('sessions')
  list(@Query() q: QuerySessionsDto) {
    return this.service.listSessions(q);
  }

  // Marcar ejercicio hecho/no-hecho
  @Patch('entries/toggle')
  toggle(@Body() dto: ToggleEntryDto) {
    return this.service.toggleEntry(dto);
  }
}
