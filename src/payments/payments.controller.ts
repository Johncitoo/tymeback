import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { JwtUser } from '../auth/current-user.decorator';

@Controller('payments')
@UseGuards(JwtAuthGuard)
export class PaymentsController {
  constructor(private readonly service: PaymentsService) {}

  @Post()
  create(@Body() dto: CreatePaymentDto, @CurrentUser() user: JwtUser) {
    return this.service.create({ ...dto, gymId: user.gymId });
  }

  @Get()
  findAll(
    @Query('limit') limit: number | undefined,
    @Query('offset') offset: number | undefined,
    @CurrentUser() user: JwtUser,
  ) {
    return this.service.findAll(user.gymId, limit, offset);
  }
}
