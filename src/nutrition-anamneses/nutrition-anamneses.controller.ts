import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { NutritionAnamnesesService } from './nutrition-anamneses.service';
import { CreateAnamnesisDto } from './dto/create-anamnesis.dto';
import { UpdateAnamnesisDto } from './dto/update-anamnesis.dto';
import { QueryAnamnesesDto } from './dto/query-anamneses.dto';

// Suponiendo que en tu Guard llenas req.user.id (string)
// Para simplificar, recibo byUserId en header X-User-Id (puedes reemplazar por tu Auth actual).
import { Headers } from '@nestjs/common';

@Controller('nutrition-anamneses')
export class NutritionAnamnesesController {
  constructor(private readonly svc: NutritionAnamnesesService) {}

  @Post()
  create(
    @Body() dto: CreateAnamnesisDto,
    @Headers('x-user-id') byUserId: string,
  ) {
    return this.svc.create(dto, byUserId);
  }

  @Get()
  findAll(
    @Query() q: QueryAnamnesesDto,
    @Headers('x-user-id') byUserId: string,
  ) {
    return this.svc.findAll(q, byUserId);
  }

  @Get(':id')
  findOne(
    @Param('id') id: string,
    @Query('gymId') gymId: string,
    @Headers('x-user-id') byUserId: string,
  ) {
    return this.svc.findOne(id, gymId, byUserId);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateAnamnesisDto,
    @Headers('x-user-id') byUserId: string,
  ) {
    return this.svc.update(id, dto, byUserId);
  }

  @Delete(':id')
  remove(
    @Param('id') id: string,
    @Query('gymId') gymId: string,
    @Headers('x-user-id') byUserId: string,
  ) {
    return this.svc.remove(id, gymId, byUserId);
  }
}
