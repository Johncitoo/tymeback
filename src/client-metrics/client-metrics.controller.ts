import { Controller, Post, Body, Get, Query, Delete, Param } from '@nestjs/common';
import { ClientMetricsService } from './client-metrics.service';
import { CreateClientMetricDto } from './dto/create-client-metric.dto';
import { QueryClientMetricsDto } from './dto/query-client-metrics.dto';

@Controller('client-metrics')
export class ClientMetricsController {
  constructor(private readonly service: ClientMetricsService) {}

  @Post()
  create(@Body() dto: CreateClientMetricDto) {
    return this.service.create(dto);
  }

  @Get()
  findAll(@Query() q: QueryClientMetricsDto) {
    return this.service.findAll(q);
  }

  @Get('latest')
  latest(@Query('gymId') gymId: string, @Query('clientId') clientId: string) {
    return this.service.latest(gymId, clientId);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Query('gymId') gymId: string) {
    return this.service.remove(id, gymId);
  }
}
