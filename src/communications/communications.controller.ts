import { Controller, Post, Patch, Get, Body, Param, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { CommunicationsService } from './communications.service';
import { CreateTemplateDto } from './dto/create-template.dto';
import { UpdateTemplateDto } from './dto/update-template.dto';
import { QueryTemplatesDto } from './dto/query-templates.dto';
import { SendTestDto } from './dto/send-test.dto';
import { CreateCampaignDto } from './dto/create-campaign.dto';
import { UpdateCampaignDto } from './dto/update-campaign.dto';
import { ScheduleCampaignDto } from './dto/schedule-campaign.dto';
import { QueryCampaignsDto } from './dto/query-campaigns.dto';
import { MailerService } from './mailer/mailer.service';

@Controller('communications')
@UseGuards(JwtAuthGuard)
export class CommunicationsController {
  constructor(
    private readonly service: CommunicationsService,
    private readonly mailer: MailerService,
  ) {}

  // Health check para servicio de email
  @Get('health')
  async healthCheck() {
    try {
      const result = await this.mailer.sendTest(process.env.EMAIL_USER || 'test@example.com');
      
      return {
        status: 'ok',
        service: 'Gmail SMTP',
        configured: true,
        message: 'Email service is working',
        dryRun: process.env.EMAIL_DRY_RUN === 'true',
      };
    } catch (error) {
      return {
        status: 'error',
        service: 'Gmail SMTP',
        configured: false,
        message: error.message,
        hint: 'Verifica que EMAIL_USER y EMAIL_PASSWORD estén configurados correctamente',
      };
    }
  }

  // Templates
  @Post('templates')
  createTemplate(@CurrentUser() user: any, @Body() dto: CreateTemplateDto) {
    return this.service.createTemplate(user.gymId, dto);
  }

  @Patch('templates/:id')
  updateTemplate(@CurrentUser() user: any, @Param('id') id: string, @Body() dto: UpdateTemplateDto) {
    return this.service.updateTemplate(user.gymId, id, dto);
  }

  @Get('templates')
  listTemplates(@CurrentUser() user: any, @Query() q: QueryTemplatesDto) {
    return this.service.listTemplates(user.gymId, q);
  }

  // Test send
  @Post('test-send')
  testSend(@CurrentUser() user: any, @Body() dto: SendTestDto) {
    return this.service.sendTest(user.gymId, dto);
  }

  // Campaigns
  @Post('campaigns')
  createCampaign(@CurrentUser() user: any, @Body() dto: CreateCampaignDto) {
    return this.service.createCampaign(user.gymId, user.sub, dto);
  }

  @Patch('campaigns/:id')
  updateCampaign(@CurrentUser() user: any, @Param('id') id: string, @Body() dto: UpdateCampaignDto) {
    return this.service.updateCampaign(user.gymId, id, dto);
  }

  @Patch('campaigns/:id/schedule')
  schedule(@CurrentUser() user: any, @Param('id') id: string, @Body() dto: ScheduleCampaignDto) {
    return this.service.scheduleCampaign(user.gymId, id, dto);
  }

  @Patch('campaigns/:id/send-now')
  sendNow(@CurrentUser() user: any, @Param('id') id: string) {
    return this.service.sendNow(id, user.gymId);
  }

  @Patch('campaigns/:id/cancel')
  cancel(@CurrentUser() user: any, @Param('id') id: string) {
    return this.service.cancelCampaign(id, user.gymId);
  }

  @Get('campaigns')
  listCampaigns(@CurrentUser() user: any, @Query() q: QueryCampaignsDto) {
    return this.service.listCampaigns(user.gymId, q);
  }

  // Email Logs
  @Get('email-logs')
  async getEmailLogs(
    @CurrentUser() user: any,
    @Query('status') status?: 'sent' | 'failed' | 'pending',
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('search') search?: string,
  ) {
    return this.service.getEmailLogs(user.gymId, { status, startDate, endDate, search });
  }

  @Get('email-logs/stats')
  async getEmailLogStats(@CurrentUser() user: any) {
    return this.service.getEmailLogStats(user.gymId);
  }

  @Get('email-logs/:id')
  async getEmailLogById(@CurrentUser() user: any, @Param('id') id: string) {
    return this.service.getEmailLogById(user.gymId, +id);
  }
}
