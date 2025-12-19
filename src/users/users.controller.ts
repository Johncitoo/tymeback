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
    // gymId viene del JWT (trusted source)
    return this.usersService.create(dto, user.gymId);
  }

  // Listar — ADMIN
  @Get()
  @Roles(RoleEnum.ADMIN)
  findAll(@Query() qry: QueryUsersDto, @CurrentUser() user: JwtUser) {
    // gymId viene del JWT (trusted source)
    return this.usersService.findAll({ ...qry, gymId: user.gymId });
  }

  // Obtener — ADMIN o el propio usuario
  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: JwtUser) {
    // Validar permisos: ADMIN o el propio usuario
    if (id !== user.sub && user.role !== RoleEnum.ADMIN) {
      throw new ForbiddenException('Solo ADMIN o el propio usuario');
    }
    // gymId viene del JWT (trusted source)
    return this.usersService.findOne(id, user.gymId);
  }

  // Actualizar — ADMIN o el propio usuario (solo ciertos campos)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateUserDto, @CurrentUser() user: JwtUser) {
    // Validar permisos: ADMIN o el propio usuario
    if (id !== user.sub && user.role !== RoleEnum.ADMIN) {
      throw new ForbiddenException('Solo ADMIN o el propio usuario');
    }
    // gymId viene del JWT (trusted source)
    return this.usersService.update(id, user.gymId, dto);
  }

  // Actualizar avatar — ADMIN o el propio usuario
  @Patch(':id/avatar')
  updateAvatar(
    @Param('id') id: string,
    @Body('avatarUrl') avatarUrl: string,
    @CurrentUser() user: JwtUser
  ) {
    // Validar permisos: ADMIN o el propio usuario
    if (id !== user.sub && user.role !== RoleEnum.ADMIN) {
      throw new ForbiddenException('Solo ADMIN o el propio usuario');
    }
    // gymId viene del JWT (trusted source)
    return this.usersService.updateAvatar(id, user.gymId, avatarUrl);
  }

  // Eliminar — ADMIN
  @Delete(':id')
  @Roles(RoleEnum.ADMIN)
  remove(@Param('id') id: string, @CurrentUser() user: JwtUser) {
    // gymId viene del JWT (trusted source)
    return this.usersService.remove(id, user.gymId);
  }
}
