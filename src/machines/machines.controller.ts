import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { MachinesService } from './machines.service';
import { CreateMachineDto } from './dto/create-machine.dto';
import { UpdateMachineDto } from './dto/update-machine.dto';
import { QueryMachinesDto } from './dto/query-machines.dto';
import { CreateMaintenanceDto } from './dto/create-maintenance.dto';

@Controller('machines')
export class MachinesController {
  constructor(private readonly service: MachinesService) {}

  @Post()
  create(@Body() dto: CreateMachineDto) {
    return this.service.create(dto);
  }

  @Get()
  findAll(@Query() q: QueryMachinesDto) {
    return this.service.findAll(q);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Query('gymId') gymId: string) {
    return this.service.findOne(id, gymId);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Query('gymId') gymId: string,
    @Body() dto: UpdateMachineDto,
  ) {
    return this.service.update(id, gymId, dto);
  }

  @Patch(':id/out-of-service')
  outOfService(@Param('id') id: string, @Query('gymId') gymId: string) {
    return this.service.setOutOfService(id, gymId);
  }

  @Patch(':id/in-service')
  inService(@Param('id') id: string, @Query('gymId') gymId: string) {
    return this.service.setInService(id, gymId);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Query('gymId') gymId: string) {
    return this.service.remove(id, gymId);
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
