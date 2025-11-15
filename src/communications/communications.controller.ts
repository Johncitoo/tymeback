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
import { ResendMailerService } from './mailer/resend-mailer.service';

@Controller('communications')
@UseGuards(JwtAuthGuard)
export class CommunicationsController {
  constructor(
    private readonly service: CommunicationsService,
    private readonly mailer: ResendMailerService,
  ) {}

  // Health check para servicio de email
  @Get('health')
  async healthCheck() {
    try {
      const result = await this.mailer.healthCheck();
      const provider = process.env.EMAIL_PROVIDER || 'resend';
      const serviceName = provider === 'gmail' ? 'Gmail SMTP' : 'Resend';
      
      return {
        status: result.configured ? 'ok' : 'error',
        service: serviceName,
        provider: provider,
        configured: result.configured,
        message: result.message,
        dryRun: process.env.EMAIL_DRY_RUN === 'true',
      };
    } catch (error) {
      const provider = process.env.EMAIL_PROVIDER || 'resend';
      const serviceName = provider === 'gmail' ? 'Gmail SMTP' : 'Resend';
      const hint = provider === 'gmail' 
        ? 'Verifica que EMAIL_USER y EMAIL_PASSWORD estén configurados correctamente'
        : 'Verifica que RESEND_API_KEY esté configurado correctamente en .env';
      
      return {
        status: 'error',
        service: serviceName,
        provider: provider,
        configured: false,
        message: error.message,
        hint: hint,
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
}
