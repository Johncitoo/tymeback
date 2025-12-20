// src/clients/clients.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ClientsService } from './clients.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { QueryClientsDto } from './dto/query-clients.dto';
import { EmergencyContactDto } from './dto/emergency-contact.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser } from '../auth/current-user.decorator';
import type { JwtUser } from '../auth/current-user.decorator';
import { RoleEnum } from '../users/entities/user.entity';

@Controller('clients')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @Post()
  @Roles(RoleEnum.ADMIN)
  async create(@Body() dto: CreateClientDto, @CurrentUser() user: JwtUser) {
    console.log('🟦 ClientsController.create - START');
    console.log('🟦 DTO received:', dto, 'gymId from JWT:', user.gymId);
    
    try {
      const result = await this.clientsService.create(dto, user.gymId);
      console.log('🟩 Client created successfully:', result);
      return result;
    } catch (error) {
      console.error('🟥 Error in ClientsController.create:', error);
      console.error('🟥 Error stack:', error.stack);
      throw error;
    }
  }

  // TEMPORAL: Endpoint para eliminar todos los clientes (SOLO DESARROLLO)
  @Delete('delete-all-clients-temp')
  @Roles(RoleEnum.ADMIN)
  async deleteAllClients(@CurrentUser() user: JwtUser) {
    return this.clientsService.deleteAllClients(user.gymId);
  }

  @Get()
  @Roles(RoleEnum.ADMIN, RoleEnum.TRAINER, RoleEnum.NUTRITIONIST)
  findAll(@Query() qry: QueryClientsDto, @CurrentUser() user: JwtUser) {
    return this.clientsService.findAll({ ...qry, gymId: user.gymId });
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: JwtUser) {
    return this.clientsService.findOne(id, user.gymId);
  }

  @Patch(':id')
  @Roles(RoleEnum.ADMIN)
  update(
    @Param('id') id: string,
    @Body() dto: UpdateClientDto,
    @CurrentUser() user: JwtUser
  ) {
    return this.clientsService.update(id, user.gymId, dto);
  }

  @Delete(':id')
  @Roles(RoleEnum.ADMIN)
  remove(@Param('id') id: string, @CurrentUser() user: JwtUser) {
    return this.clientsService.remove(id, user.gymId);
  }

  // ---- Basurero (soft delete) ----

  @Get('trash/list')
  @Roles(RoleEnum.ADMIN)
  findDeleted(@CurrentUser() user: JwtUser) {
    return this.clientsService.findDeleted(user.gymId);
  }

  @Post(':id/restore')
  @Roles(RoleEnum.ADMIN)
  restore(@Param('id') id: string, @CurrentUser() user: JwtUser) {
    return this.clientsService.restore(id, user.gymId);
  }

  @Delete(':id/permanent')
  @Roles(RoleEnum.ADMIN)
  removePermanently(@Param('id') id: string, @CurrentUser() user: JwtUser) {
    return this.clientsService.removePermanently(id, user.gymId);
  }

  // ---- Nested: emergency contacts ----

  @Get(':id/emergency-contacts')
  listContacts(@Param('id') id: string, @Query('gymId') gymId: string) {
    return this.clientsService.listContacts(id, gymId);
  }

  @Put(':id/emergency-contacts')
  replaceContacts(
    @Param('id') id: string,
    @Query('gymId') gymId: string,
    @Body() contacts: EmergencyContactDto[],
  ) {
    // Reutiliza el método de update interno para reemplazo total
    return this.clientsService.replaceContacts(id, gymId, contacts as any);
  }
}
