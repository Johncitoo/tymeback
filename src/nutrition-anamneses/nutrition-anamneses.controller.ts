import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { NutritionAnamnesesService } from './nutrition-anamneses.service';
import { CreateAnamnesisDto } from './dto/create-anamnesis.dto';
import { UpdateAnamnesisDto } from './dto/update-anamnesis.dto';
import { QueryAnamnesesDto } from './dto/query-anamneses.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

@Controller('nutrition-anamneses')
@UseGuards(JwtAuthGuard)
export class NutritionAnamnesesController {
  constructor(private readonly svc: NutritionAnamnesesService) {}

  @Post()
  create(
    @Body() dto: CreateAnamnesisDto,
    @CurrentUser() user: any,
  ) {
    return this.svc.create({ ...dto, gymId: dto.gymId || user.gymId }, user.sub);
  }

  @Get()
  findAll(
    @Query() q: QueryAnamnesesDto,
    @CurrentUser() user: any,
  ) {
    return this.svc.findAll({ ...q, gymId: q.gymId || user.gymId }, user.sub);
  }

  @Get(':id')
  findOne(
    @Param('id') id: string,
    @Query('gymId') gymId: string,
    @CurrentUser() user: any,
  ) {
    return this.svc.findOne(id, gymId || user.gymId, user.sub);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateAnamnesisDto,
    @CurrentUser() user: any,
  ) {
    return this.svc.update(id, { ...dto, gymId: dto.gymId || user.gymId }, user.sub);
  }

  @Delete(':id')
  remove(
    @Param('id') id: string,
    @Query('gymId') gymId: string,
    @CurrentUser() user: any,
  ) {
    return this.svc.remove(id, gymId || user.gymId, user.sub);
  }
}
