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
} from '@nestjs/common';
import { ClientsService } from './clients.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { QueryClientsDto } from './dto/query-clients.dto';
import { EmergencyContactDto } from './dto/emergency-contact.dto';

@Controller('clients')
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @Post()
  async create(@Body() dto: CreateClientDto) {
    console.log('🟦 ClientsController.create - START');
    console.log('🟦 DTO received:', dto);
    
    try {
      const result = await this.clientsService.create(dto);
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
  async deleteAllClients(@Query('gymId') gymId: string) {
    return this.clientsService.deleteAllClients(gymId);
  }

  @Get()
  findAll(@Query() qry: QueryClientsDto) {
    return this.clientsService.findAll(qry);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Query('gymId') gymId: string) {
    return this.clientsService.findOne(id, gymId);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Query('gymId') gymId: string,
    @Body() dto: UpdateClientDto,
  ) {
    return this.clientsService.update(id, gymId, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Query('gymId') gymId: string) {
    return this.clientsService.remove(id, gymId);
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
