import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { MachinesService } from './machines.service';
import { CreateMachineDto } from './dto/create-machine.dto';
import { UpdateMachineDto } from './dto/update-machine.dto';
import { QueryMachinesDto } from './dto/query-machines.dto';
import { CreateMaintenanceDto } from './dto/create-maintenance.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { JwtUser } from '../auth/current-user.decorator';

@Controller('machines')
@UseGuards(JwtAuthGuard)
export class MachinesController {
  constructor(private readonly service: MachinesService) {}

  @Post()
  create(@Body() dto: CreateMachineDto, @CurrentUser() user: JwtUser) {
    return this.service.create({ ...dto, gymId: user.gymId });
  }

  @Get()
  findAll(@Query() q: QueryMachinesDto, @CurrentUser() user: JwtUser) {
    return this.service.findAll({ ...q, gymId: user.gymId });
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: JwtUser) {
    return this.service.findOne(id, user.gymId);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateMachineDto,
    @CurrentUser() user: JwtUser,
  ) {
    return this.service.update(id, user.gymId, dto);
  }

  @Patch(':id/out-of-service')
  outOfService(@Param('id') id: string, @CurrentUser() user: JwtUser) {
    return this.service.setOutOfService(id, user.gymId);
  }

  @Patch(':id/in-service')
  inService(@Param('id') id: string, @CurrentUser() user: JwtUser) {
    return this.service.setInService(id, user.gymId);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: JwtUser) {
    return this.service.remove(id, user.gymId);
  }

  // --- mantenimiento ---
  @Post(':id/maintenance')
  addMaint(
    @Param('id') id: string,
    @Body() dto: CreateMaintenanceDto,
  ) {
    dto.machineId = id; // aseguramos el id de la máquina
    return this.service.addMaintenance(dto);
  }

  @Get(':id/maintenance')
  listMaint(@Param('id') id: string, @Query('gymId') gymId: string) {
    return this.service.listMaintenance(id, gymId);
  }
}
