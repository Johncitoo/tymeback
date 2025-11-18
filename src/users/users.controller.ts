import {
  Controller, Get, Post, Body, Patch, Param, Delete, Query,
  UseGuards, ForbiddenException,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { QueryUsersDto } from './dto/query-users.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser } from '../auth/current-user.decorator';
import type { JwtUser } from '../auth/current-user.decorator';
import { RoleEnum } from './entities/user.entity';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // Crear — ADMIN
  @Post()
  @Roles(RoleEnum.ADMIN)
  create(@Body() dto: CreateUserDto, @CurrentUser() user: JwtUser) {
    dto.gymId = dto.gymId ?? user.gymId;
    if (dto.gymId !== user.gymId) throw new ForbiddenException('gymId inválido');
    return this.usersService.create(dto);
  }

  // Listar — ADMIN
  @Get()
  @Roles(RoleEnum.ADMIN)
  findAll(@Query() qry: QueryUsersDto, @CurrentUser() user: JwtUser) {
    qry.gymId = qry.gymId ?? user.gymId;
    if (qry.gymId !== user.gymId) throw new ForbiddenException('gymId inválido');
    return this.usersService.findAll(qry);
  }

  // Obtener — ADMIN o el propio usuario
  @Get(':id')
  findOne(@Param('id') id: string, @Query('gymId') gymId: string, @CurrentUser() user: JwtUser) {
    const gid = gymId ?? user.gymId;
    if (gid !== user.gymId) throw new ForbiddenException('gymId inválido');
    if (id !== user.sub && user.role !== RoleEnum.ADMIN) {
      throw new ForbiddenException('Solo ADMIN o el propio usuario');
    }
    return this.usersService.findOne(id, gid);
  }

  // Actualizar — ADMIN o el propio usuario (solo ciertos campos)
  @Patch(':id')
  update(@Param('id') id: string, @Query('gymId') gymId: string, @Body() dto: UpdateUserDto, @CurrentUser() user: JwtUser) {
    const gid = gymId ?? user.gymId;
    if (gid !== user.gymId) throw new ForbiddenException('gymId inválido');
    
    // Si no es ADMIN, solo puede actualizar sus propios datos
    if (id !== user.sub && user.role !== RoleEnum.ADMIN) {
      throw new ForbiddenException('Solo ADMIN o el propio usuario');
    }
    
    return this.usersService.update(id, gid, dto);
  }

  // Actualizar avatar — ADMIN o el propio usuario
  @Patch(':id/avatar')
  updateAvatar(
    @Param('id') id: string,
    @Query('gymId') gymId: string,
    @Body('avatarUrl') avatarUrl: string,
    @CurrentUser() user: JwtUser
  ) {
    const gid = gymId ?? user.gymId;
    if (gid !== user.gymId) throw new ForbiddenException('gymId inválido');
    
    // Solo el propio usuario o ADMIN puede cambiar el avatar
    if (id !== user.sub && user.role !== RoleEnum.ADMIN) {
      throw new ForbiddenException('Solo ADMIN o el propio usuario');
    }
    
    return this.usersService.updateAvatar(id, gid, avatarUrl);
  }

  // Eliminar — ADMIN
  @Delete(':id')
  @Roles(RoleEnum.ADMIN)
  remove(@Param('id') id: string, @Query('gymId') gymId: string, @CurrentUser() user: JwtUser) {
    const gid = gymId ?? user.gymId;
    if (gid !== user.gymId) throw new ForbiddenException('gymId inválido');
    return this.usersService.remove(id, gid);
  }
}
