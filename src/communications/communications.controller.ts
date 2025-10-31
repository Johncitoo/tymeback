import { Controller, Post, Patch, Get, Body, Param, Query } from '@nestjs/common';
import { CommunicationsService } from './communications.service';
import { CreateTemplateDto } from './dto/create-template.dto';
import { UpdateTemplateDto } from './dto/update-template.dto';
import { QueryTemplatesDto } from './dto/query-templates.dto';
import { SendTestDto } from './dto/send-test.dto';
import { CreateCampaignDto } from './dto/create-campaign.dto';
import { UpdateCampaignDto } from './dto/update-campaign.dto';
import { ScheduleCampaignDto } from './dto/schedule-campaign.dto';
import { QueryCampaignsDto } from './dto/query-campaigns.dto';

@Controller('api/communications')
export class CommunicationsController {
  constructor(private readonly service: CommunicationsService) {}

  // Templates
  @Post('templates')
  createTemplate(@Body() dto: CreateTemplateDto) {
    return this.service.createTemplate(dto);
  }

  @Patch('templates/:id')
  updateTemplate(@Param('id') id: string, @Body() dto: UpdateTemplateDto) {
    return this.service.updateTemplate(id, dto);
  }

  @Get('templates')
  listTemplates(@Query() q: QueryTemplatesDto) {
    return this.service.listTemplates(q);
  }

  // Test send
  @Post('test-send')
  testSend(@Body() dto: SendTestDto) {
    return this.service.sendTest(dto);
  }

  // Campaigns
  @Post('campaigns')
  createCampaign(@Body() dto: CreateCampaignDto) {
    return this.service.createCampaign(dto);
  }

  @Patch('campaigns/:id')
  updateCampaign(@Param('id') id: string, @Body() dto: UpdateCampaignDto) {
    return this.service.updateCampaign(id, dto);
  }

  @Patch('campaigns/:id/schedule')
  schedule(@Param('id') id: string, @Body() dto: ScheduleCampaignDto) {
    return this.service.scheduleCampaign(id, dto);
  }

  @Patch('campaigns/:id/send-now')
  sendNow(@Param('id') id: string, @Query('gymId') gymId: string) {
    return this.service.sendNow(id, gymId);
  }

  @Patch('campaigns/:id/cancel')
  cancel(@Param('id') id: string, @Query('gymId') gymId: string) {
    return this.service.cancelCampaign(id, gymId);
  }

  @Get('campaigns')
  listCampaigns(@Query() q: QueryCampaignsDto) {
    return this.service.listCampaigns(q);
  }
}
