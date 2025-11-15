import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards, ForbiddenException } from '@nestjs/common';
import { GymHoursService } from './gym-hours.service';
import { UpsertHourDto } from './dto/upsert-hour.dto';
import { BulkUpsertHoursDto } from './dto/bulk-upsert-hours.dto';
import { CreateOverrideDto } from './dto/create-override.dto';
import { QueryHoursDto } from './dto/query-hours.dto';
import { QueryOverridesDto } from './dto/query-overrides.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser } from '../auth/current-user.decorator';
import type { JwtUser } from '../auth/current-user.decorator';
import { RoleEnum } from '../users/entities/user.entity';

@Controller('gym-hours')
@UseGuards(JwtAuthGuard, RolesGuard)
export class GymHoursController {
  constructor(private readonly service: GymHoursService) {}

  // Weekly hours (ADMIN)
  @Put('weekly')
  @Roles(RoleEnum.ADMIN)
  upsert(@Body() dto: UpsertHourDto, @CurrentUser() user: JwtUser) {
    dto.gymId = dto.gymId ?? user.gymId;
    dto.byUserId = dto.byUserId ?? user.sub;
    if (dto.gymId !== user.gymId) throw new ForbiddenException('gymId inválido');
    if (dto.byUserId !== user.sub) throw new ForbiddenException('byUserId inválido');
    return this.service.upsertHour(dto);
  }

  @Put('weekly/bulk')
  @Roles(RoleEnum.ADMIN)
  bulk(@Body() dto: BulkUpsertHoursDto, @CurrentUser() user: JwtUser) {
    // Completar en cada item
    for (const it of dto.items ?? []) {
      it.gymId = it.gymId ?? user.gymId;
      it.byUserId = it.byUserId ?? user.sub;
      if (it.gymId !== user.gymId) throw new ForbiddenException('gymId inválido');
      if (it.byUserId !== user.sub) throw new ForbiddenException('byUserId inválido');
    }
    return this.service.bulkUpsert(dto);
  }

  // Lectura semanal (cualquier rol autenticado)
  @Get('weekly')
  listWeekly(@Query('gymId') gymId: string, @CurrentUser() user: JwtUser) {
    const gid = gymId ?? user.gymId;
    if (gid !== user.gymId) throw new ForbiddenException('gymId inválido');
    return this.service.listWeekly(gid);
  }

  // Overrides (ADMIN)
  @Post('overrides')
  @Roles(RoleEnum.ADMIN)
  createOverride(@Body() dto: CreateOverrideDto, @CurrentUser() user: JwtUser) {
    dto.gymId = dto.gymId ?? user.gymId;
    dto.byUserId = dto.byUserId ?? user.sub;
    if (dto.gymId !== user.gymId) throw new ForbiddenException('gymId inválido');
    if (dto.byUserId !== user.sub) throw new ForbiddenException('byUserId inválido');
    return this.service.createOverride(dto);
  }

  // Listar overrides (cualquier rol autenticado)
  @Get('overrides')
  listOverrides(@Query() q: QueryOverridesDto, @CurrentUser() user: JwtUser) {
    q.gymId = q.gymId ?? user.gymId;
    if (q.gymId !== user.gymId) throw new ForbiddenException('gymId inválido');
    return this.service.listOverrides(q);
  }

  // Eliminar override (ADMIN)
  @Delete('overrides/:id')
  @Roles(RoleEnum.ADMIN)
  removeOverride(
    @Param('id') id: string,
    @Query('gymId') gymId: string,
    @Query('byUserId') byUserId: string,
    @CurrentUser() user: JwtUser,
  ) {
    const gid = gymId ?? user.gymId;
    const uid = byUserId ?? user.sub;
    if (gid !== user.gymId) throw new ForbiddenException('gymId inválido');
    if (uid !== user.sub) throw new ForbiddenException('byUserId inválido');
    return this.service.removeOverride(id, gid, uid);
  }

  // Resolver horario efectivo (cualquier rol autenticado)
  @Get('resolve')
  resolve(@Query() q: QueryHoursDto, @CurrentUser() user: JwtUser) {
    q.gymId = q.gymId ?? user.gymId;
    if (q.gymId !== user.gymId) throw new ForbiddenException('gymId inválido');
    return this.service.resolve(q);
  }
}
