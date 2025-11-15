import { Body, Controller, Delete, Get, Param, Patch, Post, Put, Query } from '@nestjs/common';
import { NutritionService } from './nutrition.service';
import { CreateAnamnesisDto } from './dto/create-anamnesis.dto';
import { UpdateAnamnesisDto } from './dto/update-anamnesis.dto';
import { QueryAnamnesesDto } from './dto/query-anamneses.dto';
import { CreateBodyEvalDto } from './dto/create-body-eval.dto';
import { UpdateBodyEvalDto } from './dto/update-body-eval.dto';
import { QueryBodyEvalsDto } from './dto/query-body-evals.dto';
import { CreateInbodyDto } from './dto/create-inbody.dto';
import { UpdateInbodyDto } from './dto/update-inbody.dto';
import { QueryInbodyDto } from './dto/query-inbody.dto';
import { CreateNutritionPlanDto } from './dto/create-nutrition-plan.dto';
import { UpdateNutritionPlanDto } from './dto/update-nutrition-plan.dto';
import { QueryNutritionPlansDto } from './dto/query-nutrition-plans.dto';

@Controller('nutrition')
export class NutritionController {
  constructor(private readonly service: NutritionService) {}

  // ---------- Anamnesis ----------
  @Post('anamneses')
  createAnamnesis(@Body() dto: CreateAnamnesisDto) {
    return this.service.createAnamnesis(dto);
  }

  @Put('anamneses/:id')
  updateAnamnesis(@Param('id') id: string, @Query('gymId') gymId: string, @Body() dto: UpdateAnamnesisDto) {
    return this.service.updateAnamnesis(id, gymId, dto);
  }

  @Get('anamneses')
  listAnamneses(@Query() q: QueryAnamnesesDto) {
    return this.service.listAnamneses(q);
  }

  @Delete('anamneses/:id')
  removeAnamnesis(@Param('id') id: string, @Query('gymId') gymId: string, @Query('byUserId') byUserId: string) {
    return this.service.removeAnamnesis(id, gymId, byUserId);
  }

  // ---------- Body Evaluations ----------
  @Post('body-evaluations')
  createBodyEval(@Body() dto: CreateBodyEvalDto) {
    return this.service.createBodyEval(dto);
  }

  @Put('body-evaluations/:id')
  updateBodyEval(@Param('id') id: string, @Query('gymId') gymId: string, @Body() dto: UpdateBodyEvalDto) {
    return this.service.updateBodyEval(id, gymId, dto);
  }

  @Get('body-evaluations')
  listBodyEvals(@Query() q: QueryBodyEvalsDto) {
    return this.service.listBodyEvals(q);
  }

  @Delete('body-evaluations/:id')
  removeBodyEval(@Param('id') id: string, @Query('gymId') gymId: string, @Query('byUserId') byUserId: string) {
    return this.service.removeBodyEval(id, gymId, byUserId);
  }

  // ---------- InBody ----------
  @Post('inbody-scans')
  createInbody(@Body() dto: CreateInbodyDto) {
    return this.service.createInbody(dto);
  }

  @Put('inbody-scans/:id')
  updateInbody(@Param('id') id: string, @Query('gymId') gymId: string, @Body() dto: UpdateInbodyDto) {
    return this.service.updateInbody(id, gymId, dto);
  }

  @Get('inbody-scans')
  listInbody(@Query() q: QueryInbodyDto) {
    return this.service.listInbody(q);
  }

  @Delete('inbody-scans/:id')
  removeInbody(@Param('id') id: string, @Query('gymId') gymId: string, @Query('byUserId') byUserId: string) {
    return this.service.removeInbody(id, gymId, byUserId);
  }

  // ---------- Nutrition Plans ----------
  @Post('plans')
  createPlan(@Body() dto: CreateNutritionPlanDto) {
    return this.service.createPlan(dto);
  }

  @Put('plans/:id')
  updatePlan(@Param('id') id: string, @Query('gymId') gymId: string, @Body() dto: UpdateNutritionPlanDto) {
    return this.service.updatePlan(id, gymId, dto);
  }

  @Patch('plans/:id/active')
  setActive(
    @Param('id') id: string,
    @Query('gymId') gymId: string,
    @Query('byUserId') byUserId: string,
    @Query('value') value: 'true' | 'false',
  ) {
    return this.service.setActive(id, gymId, byUserId, value === 'true');
  }

  @Get('plans')
  listPlans(@Query() q: QueryNutritionPlansDto) {
    return this.service.listPlans(q);
  }

  @Delete('plans/:id')
  removePlan(@Param('id') id: string, @Query('gymId') gymId: string, @Query('byUserId') byUserId: string) {
    return this.service.removePlan(id, gymId, byUserId);
  }
}
