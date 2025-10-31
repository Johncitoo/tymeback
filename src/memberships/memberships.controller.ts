import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards, ForbiddenException } from '@nestjs/common';
import { MembershipsService } from './memberships.service';
import { CreateMembershipFromPlanDto } from './dto/create-membership-from-plan.dto';
import { UseSessionsDto } from './dto/use-sessions.dto';
import { QueryMembershipsDto } from './dto/query-memberships.dto';
import { MembershipStatusEnum } from './entities/membership.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser, type JwtUser } from '../auth/current-user.decorator';
import { RoleEnum } from '../users/entities/user.entity';

@Controller('api/memberships')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MembershipsController {
  constructor(private readonly service: MembershipsService) {}

  // Crear desde plan — ADMIN
  @Post('from-plan')
  @Roles(RoleEnum.ADMIN)
  createFromPlan(@Body() dto: CreateMembershipFromPlanDto, @CurrentUser() user: JwtUser) {
    dto.gymId = dto.gymId ?? user.gymId;
    dto.byUserId = dto.byUserId ?? user.sub;
    if (dto.gymId !== user.gymId) throw new ForbiddenException('gymId inválido');
    if (dto.byUserId !== user.sub) throw new ForbiddenException('byUserId inválido');
    return this.service.createFromPlan(dto);
  }

  // Listar — cualquier rol autenticado
  @Get()
  list(@Query() q: QueryMembershipsDto, @CurrentUser() user: JwtUser) {
    q.gymId = q.gymId ?? user.gymId;
    if (q.gymId !== user.gymId) throw new ForbiddenException('gymId inválido');
    return this.service.list(q);
  }

  // Activa vigente para cliente — cualquier rol autenticado
  @Get('active')
  getActive(
    @Query('gymId') gymId: string,
    @Query('clientId') clientId: string,
    @Query('activeAt') activeAt: string | undefined,
    @CurrentUser() user: JwtUser,
  ) {
    const gid = gymId ?? user.gymId;
    if (gid !== user.gymId) throw new ForbiddenException('gymId inválido');
    return this.service.getActiveForClient(clientId, gid, activeAt);
  }

  // Consumir sesiones — ADMIN (si prefieres permitir TRAINER, agrega el rol aquí)
  @Patch(':id/use-sessions')
  @Roles(RoleEnum.ADMIN)
  useSessions(@Param('id') id: string, @Body() dto: UseSessionsDto, @CurrentUser() user: JwtUser) {
    dto.gymId = dto.gymId ?? user.gymId;
    if (dto.gymId !== user.gymId) throw new ForbiddenException('gymId inválido');
    return this.service.useSessions(id, dto);
  }

  // Cambiar estado — ADMIN
  @Patch(':id/status/:status')
  @Roles(RoleEnum.ADMIN)
  setStatus(
    @Param('id') id: string,
    @Param('status') status: MembershipStatusEnum,
    @Query('gymId') gymId: string,
    @Query('byUserId') byUserId: string,
    @CurrentUser() user: JwtUser,
  ) {
    const gid = gymId ?? user.gymId;
    const uid = byUserId ?? user.sub;
    if (gid !== user.gymId) throw new ForbiddenException('gymId inválido');
    if (uid !== user.sub) throw new ForbiddenException('byUserId inválido');
    return this.service.setStatus(id, gid, uid, status);
  }
}
