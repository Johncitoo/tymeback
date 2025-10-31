import { Body, Controller, Get, Param, Patch, Post, Put, Query, UseGuards, ForbiddenException } from '@nestjs/common';
import { AppointmentsService } from './appointments.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { QueryAppointmentsDto } from './dto/query-appointments.dto';
import { RescheduleAppointmentDto } from './dto/reschedule-appointment.dto';
import { CancelAppointmentDto } from './dto/cancel-appointment.dto';
import { CompleteAppointmentDto } from './dto/complete-appointment.dto';
import { SetNoShowDto } from './dto/set-no-show.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser } from '../auth/current-user.decorator';
import type { JwtUser } from '../auth/current-user.decorator';
import { RoleEnum } from '../users/entities/user.entity';

@Controller('api/appointments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AppointmentsController {
  constructor(private readonly service: AppointmentsService) {}

  // Crear: ADMIN/TRAINER/NUTRITIONIST
  @Post()
  @Roles(RoleEnum.ADMIN, RoleEnum.TRAINER, RoleEnum.NUTRITIONIST)
  create(@Body() dto: CreateAppointmentDto, @CurrentUser() user: JwtUser) {
    dto.gymId = dto.gymId ?? user.gymId;
    dto.createdByUserId = dto.createdByUserId ?? user.sub;
    if (dto.gymId !== user.gymId) throw new ForbiddenException('gymId inválido');
    if (dto.createdByUserId !== user.sub) throw new ForbiddenException('createdByUserId inválido');
    return this.service.create(dto);
  }

  // Listar: cualquier rol autenticado
  @Get()
  list(@Query() q: QueryAppointmentsDto, @CurrentUser() user: JwtUser) {
    q.gymId = q.gymId ?? user.gymId;
    if (q.gymId !== user.gymId) throw new ForbiddenException('gymId inválido');
    return this.service.findAll(q);
  }

  // Obtener: cualquier rol autenticado (mismo gym)
  @Get(':id')
  getOne(@Param('id') id: string, @Query('gymId') gymId: string, @CurrentUser() user: JwtUser) {
    const gid = gymId ?? user.gymId;
    if (gid !== user.gymId) throw new ForbiddenException('gymId inválido');
    return this.service.findOne(id, gid);
  }

  // Reprogramar: ADMIN/TRAINER/NUTRITIONIST
  @Put(':id/reschedule')
  @Roles(RoleEnum.ADMIN, RoleEnum.TRAINER, RoleEnum.NUTRITIONIST)
  reschedule(@Param('id') id: string, @Body() dto: RescheduleAppointmentDto, @CurrentUser() user: JwtUser) {
    dto.gymId = dto.gymId ?? user.gymId;
    if (dto.gymId !== user.gymId) throw new ForbiddenException('gymId inválido');
    return this.service.reschedule(id, dto);
  }

  // Cancelar: ADMIN/TRAINER/NUTRITIONIST
  @Patch(':id/cancel')
  @Roles(RoleEnum.ADMIN, RoleEnum.TRAINER, RoleEnum.NUTRITIONIST)
  cancel(@Param('id') id: string, @Body() dto: CancelAppointmentDto, @CurrentUser() user: JwtUser) {
    dto.gymId = dto.gymId ?? user.gymId;
    dto.byUserId = dto.byUserId ?? user.sub;
    if (dto.gymId !== user.gymId) throw new ForbiddenException('gymId inválido');
    if (dto.byUserId !== user.sub) throw new ForbiddenException('byUserId inválido');
    return this.service.cancel(id, dto);
  }

  // Completar: ADMIN/TRAINER/NUTRITIONIST
  @Patch(':id/complete')
  @Roles(RoleEnum.ADMIN, RoleEnum.TRAINER, RoleEnum.NUTRITIONIST)
  complete(@Param('id') id: string, @Body() dto: CompleteAppointmentDto, @CurrentUser() user: JwtUser) {
    dto.gymId = dto.gymId ?? user.gymId;
    if (dto.gymId !== user.gymId) throw new ForbiddenException('gymId inválido');
    return this.service.complete(id, dto);
  }

  // No-show: ADMIN/TRAINER/NUTRITIONIST
  @Patch(':id/no-show')
  @Roles(RoleEnum.ADMIN, RoleEnum.TRAINER, RoleEnum.NUTRITIONIST)
  setNoShow(@Param('id') id: string, @Body() dto: SetNoShowDto, @CurrentUser() user: JwtUser) {
    dto.gymId = dto.gymId ?? user.gymId;
    if (dto.gymId !== user.gymId) throw new ForbiddenException('gymId inválido');
    return this.service.setNoShow(id, dto);
  }
}
