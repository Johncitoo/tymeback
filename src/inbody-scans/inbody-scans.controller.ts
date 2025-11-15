import { Body, Controller, Delete, Get, Param, Post, Put, Query } from '@nestjs/common';
import { InbodyScansService } from './inbody-scans.service';
import { CreateInbodyScanDto } from './dto/create-inbody-scan.dto';
import { UpdateInbodyScanDto } from './dto/update-inbody-scan.dto';
import { QueryInbodyScansDto } from './dto/query-inbody-scans.dto';

@Controller('nutrition/inbody-scans')
export class InbodyScansController {
  constructor(private readonly service: InbodyScansService) {}

  @Post()
  create(@Body() dto: CreateInbodyScanDto) {
    return this.service.create(dto);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateInbodyScanDto) {
    return this.service.update(id, dto);
  }

  @Get()
  findAll(@Query() q: QueryInbodyScansDto) {
    return this.service.findAll(q);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Query('gymId') gymId: string) {
    return this.service.findOne(id, gymId);
  }

  @Delete(':id')
  remove(
    @Param('id') id: string,
    @Query('gymId') gymId: string,
    @Query('byUserId') byUserId: string,
  ) {
    return this.service.remove(id, gymId, byUserId);
  }
}
