import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { InbodyScansService } from './inbody-scans.service';
import { CreateInbodyScanDto } from './dto/create-inbody-scan.dto';
import { UpdateInbodyScanDto } from './dto/update-inbody-scan.dto';
import { QueryInbodyScansDto } from './dto/query-inbody-scans.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

@Controller('inbody-scans')
@UseGuards(JwtAuthGuard)
export class InbodyScansController {
  constructor(private readonly service: InbodyScansService) {}

  @Post()
  create(@Body() dto: CreateInbodyScanDto, @CurrentUser() user: any) {
    return this.service.create({ ...dto, gymId: dto.gymId || user.gymId });
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateInbodyScanDto, @CurrentUser() user: any) {
    return this.service.update(id, { ...dto, gymId: dto.gymId || user.gymId });
  }

  @Get()
  findAll(@Query() q: QueryInbodyScansDto, @CurrentUser() user: any) {
    return this.service.findAll({ ...q, gymId: q.gymId || user.gymId });
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Query('gymId') gymId: string, @CurrentUser() user: any) {
    return this.service.findOne(id, gymId || user.gymId);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Query('gymId') gymId: string, @CurrentUser() user: any) {
    return this.service.remove(id, gymId || user.gymId, user.sub);
  }
}
