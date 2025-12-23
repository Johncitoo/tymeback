import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { PromotionsService } from './promotions.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { JwtUser } from '../auth/current-user.decorator';

@Controller('promotions')
@UseGuards(JwtAuthGuard)
export class PromotionsController {
  constructor(private readonly service: PromotionsService) {}

  @Get()
  findAll(@CurrentUser() user: JwtUser) {
    return this.service.findAll(user.gymId);
  }

  @Get('validate')
  async validateCode(
    @Query('code') code: string,
    @Query('planId') planId: string,
    @CurrentUser() user: JwtUser,
  ) {
    return this.service.validatePromotion(user.gymId, code, planId);
  }
}
