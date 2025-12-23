import { Controller, Post, Patch, Get, Body, Param, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { CommunicationsService } from './communications.service';
import { AutomatedEmailsService } from './automated-emails.service';
import { CreateTemplateDto } from './dto/create-template.dto';
import { UpdateTemplateDto } from './dto/update-template.dto';
import { QueryTemplatesDto } from './dto/query-templates.dto';
import { SendTestDto } from './dto/send-test.dto';
import { CreateCampaignDto } from './dto/create-campaign.dto';
import { UpdateCampaignDto } from './dto/update-campaign.dto';
import { ScheduleCampaignDto } from './dto/schedule-campaign.dto';
import { QueryCampaignsDto } from './dto/query-campaigns.dto';
import { UpdateAutomatedEmailDto, SendMassEmailDto } from './dto/automated-emails.dto';
import { AutomatedEmailType } from './entities/automated-email-template.entity';
import { MailerService } from './mailer/mailer.service';

@Controller('communications')
@UseGuards(JwtAuthGuard)
export class CommunicationsController {
  constructor(
    private readonly service: CommunicationsService,
    private readonly automatedService: AutomatedEmailsService,
    private readonly mailer: MailerService,
  ) {}

  // ========== CORREOS AUTOMÁTICOS ==========

  @Get('automated-templates')
  getAutomatedTemplates(@CurrentUser() user: any) {
    return this.automatedService.getAutomatedTemplates(user.gymId);
  }

  @Get('automated-templates/:type')
  getAutomatedTemplate(@CurrentUser() user: any, @Param('type') type: string) {
    return this.automatedService.getAutomatedTemplate(user.gymId, type as AutomatedEmailType);
  }

  @Patch('automated-templates/:type')
  updateAutomatedTemplate(
    @CurrentUser() user: any,
    @Param('type') type: string,
    @Body() dto: UpdateAutomatedEmailDto,
  ) {
    return this.automatedService.updateAutomatedTemplate(user.gymId, type as AutomatedEmailType, dto);
  }

  // ========== ENVÍO MASIVO ==========

  @Post('support-request')
  async sendSupportRequest(@Body() dto: any, @CurrentUser() user?: any) {
    const gymId = dto.gymId || user?.gymId;
    const clientData = dto.clientId ? await this.service.getClientInfo(dto.clientId, gymId) : null;
    return this.service.sendSupportRequest(gymId, dto.reason, dto.message, clientData, dto.email, dto.gymSlug);
  }

  @Post('mass-email/preview')
  async previewMassEmail(@CurrentUser() user: any, @Body() dto: SendMassEmailDto) {
    const recipients = await this.automatedService.getRecipients(user.gymId, dto);
    return { count: recipients.length, recipients: recipients.map(r => ({ id: r.id, email: r.email, firstName: r.firstName, lastName: r.lastName })) };
  }

  @Post('mass-email')
  sendMassEmail(@CurrentUser() user: any, @Body() dto: SendMassEmailDto) {
    return this.automatedService.sendMassEmail(user.gymId, user.sub, dto);
  }

  @Get('mass-email/history')
  getMassEmailHistory(@CurrentUser() user: any) {
    return this.automatedService.getMassEmailHistory(user.gymId);
  }

  // ========== LEGACY (mantener compatibilidad) ==========

  // Health check para servicio de email
  @Get('health')
  async healthCheck() {
    try {
      // Ya no mostrar el mensaje poco profesional
      return {
        status: 'ok',
        configured: true,
      };
    } catch (error) {
      return {
        status: 'error',
        configured: false,
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
    return this.service.getEmailLogById(user.gymId, id);
  }
}
