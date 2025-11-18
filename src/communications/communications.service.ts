import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Repository,
  In,
  MoreThanOrEqual,
  LessThanOrEqual,
} from 'typeorm';
import { EmailTemplate } from './entities/email-template.entity';
import { EmailCampaign, CampaignStatusEnum } from './entities/email-campaign.entity';
import { CampaignRecipient, RecipientStatusEnum } from './entities/campaign-recipient.entity';
import { EmailLog, EmailLogStatusEnum } from './entities/email-log.entity';
import { MembershipReminder } from './entities/membership-reminder.entity';
import { CreateTemplateDto } from './dto/create-template.dto';
import { UpdateTemplateDto } from './dto/update-template.dto';
import { CreateCampaignDto } from './dto/create-campaign.dto';
import { UpdateCampaignDto } from './dto/update-campaign.dto';
import { ScheduleCampaignDto } from './dto/schedule-campaign.dto';
import { QueryTemplatesDto } from './dto/query-templates.dto';
import { QueryCampaignsDto } from './dto/query-campaigns.dto';
import { SendTestDto } from './dto/send-test.dto';
import { MailerService } from './mailer/mailer.service';
import { User, RoleEnum } from '../users/entities/user.entity';
import { Membership } from '../memberships/entities/membership.entity';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Plan } from '../plans/entities/plan.entity';

@Injectable()
export class CommunicationsService {
  constructor(
    @InjectRepository(EmailTemplate) private readonly tplRepo: Repository<EmailTemplate>,
    @InjectRepository(EmailCampaign) private readonly campRepo: Repository<EmailCampaign>,
    @InjectRepository(CampaignRecipient) private readonly recRepo: Repository<CampaignRecipient>,
    @InjectRepository(EmailLog) private readonly logRepo: Repository<EmailLog>,
    @InjectRepository(MembershipReminder) private readonly remRepo: Repository<MembershipReminder>,
    @InjectRepository(User) private readonly usersRepo: Repository<User>,
    @InjectRepository(Membership) private readonly memRepo: Repository<Membership>,
    @InjectRepository(Plan) private readonly plansRepo: Repository<Plan>,
    private readonly mailer: MailerService,
  ) {}

  // ---------- helpers ----------
  private interpolate(html: string, vars: Record<string, string | number>) {
    return html.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? ''));
  }

  private todayISO(): string {
    return new Date().toISOString().slice(0, 10);
  }

  // ---------- Templates ----------
  async createTemplate(gymId: string, dto: CreateTemplateDto) {
    const row = this.tplRepo.create({
      gymId,
      name: dto.name,
      subject: dto.subject,
      html: dto.html,
      isActive: dto.isActive ?? true,
    });
    return this.tplRepo.save(row);
  }

  async updateTemplate(gymId: string, id: string, dto: UpdateTemplateDto) {
    const row = await this.tplRepo.findOne({ where: { id, gymId } });
    if (!row) throw new NotFoundException('Plantilla no encontrada');
    Object.assign(row, dto);
    return this.tplRepo.save(row);
  }

  async listTemplates(gymId: string, q: QueryTemplatesDto) {
    const where: any = { gymId };
    if (typeof q.isActive === 'string') where.isActive = q.isActive === 'true';
    return this.tplRepo.find({ where, order: { updatedAt: 'DESC' } });
  }

  // ---------- Test send ----------
  async sendTest(gymId: string, dto: SendTestDto) {
    const messageId = await this.mailer.send(dto.to, dto.subject, dto.html);
    await this.logRepo.save(this.logRepo.create({
      gymId,
      toEmail: dto.to,
      subject: dto.subject,
      templateId: null,
      campaignId: null,
      status: EmailLogStatusEnum.SENT,
      providerMessageId: messageId,
      error: null,
    }));
    return { ok: true, messageId };
  }

  // ---------- Campaigns ----------
  async createCampaign(gymId: string, userId: string, dto: CreateCampaignDto) {
    const filters = dto.filters ? JSON.parse(dto.filters) : null;
    const row = this.campRepo.create({
      gymId,
      subject: dto.subject,
      html: dto.html,
      filters,
      status: CampaignStatusEnum.DRAFT,
      scheduledAt: undefined,
      createdBy: userId,
    });
    return this.campRepo.save(row);
  }

  async updateCampaign(gymId: string, id: string, dto: UpdateCampaignDto) {
    const row = await this.campRepo.findOne({ where: { id, gymId } });
    if (!row) throw new NotFoundException('Campaña no encontrada');
    if (row.status !== CampaignStatusEnum.DRAFT) {
      throw new Error('Solo se puede editar una campaña en DRAFT');
    }
    Object.assign(row, {
      subject: dto.subject ?? row.subject,
      html: dto.html ?? row.html,
      filters: dto.filters ? JSON.parse(dto.filters) : row.filters,
    });
    return this.campRepo.save(row);
  }

  async scheduleCampaign(gymId: string, id: string, dto: ScheduleCampaignDto) {
    const row = await this.campRepo.findOne({ where: { id, gymId } });
    if (!row) throw new NotFoundException('Campaña no encontrada');
    row.status = CampaignStatusEnum.SCHEDULED;
    row.scheduledAt = new Date(dto.scheduledAt);
    return this.campRepo.save(row);
  }

  async cancelCampaign(id: string, gymId: string) {
    const row = await this.campRepo.findOne({ where: { id, gymId } });
    if (!row) throw new NotFoundException('Campaña no encontrada');
    row.status = CampaignStatusEnum.CANCELLED;
    row.scheduledAt = undefined;
    return this.campRepo.save(row);
  }

  async listCampaigns(gymId: string, q: QueryCampaignsDto) {
    const where: any = { gymId };
    if (q.status) where.status = q.status;
    return this.campRepo.find({ where, order: { createdAt: 'DESC' } });
  }

  // Obtener destinatarios según filtros simples (CLIENT activos, por plan/trainer)
  private async resolveRecipients(
    gymId: string,
    filters: any,
  ): Promise<Array<{ clientId: string | null; email: string }>> {
    // Por simplicidad, sacamos emails desde users CLIENT
    const whereUser: any = { gymId, role: RoleEnum.CLIENT, isActive: true };
    const users = await this.usersRepo.find({ where: whereUser });

    // Asegurar email:string (no null) con type guard
    const candidates: Array<{ clientId: string; email: string }> = users
      .filter((u): u is User & { email: string } => !!u.email)
      .map(u => ({ clientId: u.id, email: u.email }));

    if (filters?.activeOnly) {
      const today = this.todayISO();
      const activeMems = await this.memRepo.find({
        where: { startsOn: LessThanOrEqual(today), endsOn: MoreThanOrEqual(today) },
        select: ['clientId'],
      });
      const activeSet = new Set(activeMems.map(m => m.clientId));
      return candidates.filter(c => activeSet.has(c.clientId));
    }

    return candidates;
  }

  async sendNow(id: string, gymId: string) {
    const camp = await this.campRepo.findOne({ where: { id, gymId } });
    if (!camp) throw new NotFoundException('Campaña no encontrada');

    camp.status = CampaignStatusEnum.SENT;
    await this.campRepo.save(camp);

    const recipients = await this.resolveRecipients(gymId, camp.filters ?? {});
    const rows: CampaignRecipient[] = recipients.map(r =>
      this.recRepo.create({
        campaignId: camp.id,
        gymId,
        clientId: r.clientId,
        toEmail: r.email,
        status: RecipientStatusEnum.PENDING,
        sentAt: null,
        error: null,
      }),
    );
    await this.recRepo.save(rows);

    for (const rec of rows) {
      try {
        const messageId = await this.mailer.send(rec.toEmail, camp.subject, camp.html ?? '');
        rec.status = RecipientStatusEnum.SENT;
        rec.sentAt = new Date();
        await this.recRepo.save(rec);
        await this.logRepo.save(this.logRepo.create({
          gymId,
          toEmail: rec.toEmail,
          subject: camp.subject,
          templateId: null,
          campaignId: camp.id,
          status: EmailLogStatusEnum.SENT,
          providerMessageId: messageId,
          error: null,
        }));
      } catch (e: any) {
        rec.status = RecipientStatusEnum.FAILED;
        rec.error = e?.message ?? String(e);
        await this.recRepo.save(rec);
        await this.logRepo.save(this.logRepo.create({
          gymId,
          toEmail: rec.toEmail,
          subject: camp.subject,
          templateId: null,
          campaignId: camp.id,
          status: EmailLogStatusEnum.FAILED,
          providerMessageId: null,
          error: rec.error,
        }));
      }
    }

    camp.status = CampaignStatusEnum.SENT;
    camp.scheduledAt = undefined;
    return this.campRepo.save(camp);
  }

  // ---------- Recordatorios 7/3/1 a las 09:00 America/Santiago ----------
  @Cron(CronExpression.EVERY_DAY_AT_9AM, { timeZone: 'America/Santiago' })
  async dailyRemindersJob() {
    // Plantillas activas por gimnasio con propósito REMINDER_EXPIRY
    const gyms = await this.tplRepo
      .createQueryBuilder('t')
      .select('DISTINCT t.gym_id', 'gym_id')
      .where('t.is_active = true')
      .getRawMany<{ gym_id: string }>();

    const daysSet = [7, 3, 1];
    const today = new Date();

    for (const g of gyms) {
      const gymId = g.gym_id;

      // plantilla por gimnasio
      const tpl = await this.tplRepo.findOne({
        where: { gymId, isActive: true },
        order: { createdAt: 'DESC' },
      });
      if (!tpl) continue;

      for (const d of daysSet) {
        const target = new Date(Date.UTC(
          today.getUTCFullYear(),
          today.getUTCMonth(),
          today.getUTCDate() + d,
        ));
        const targetISO = target.toISOString().slice(0, 10);

        // Primero obtenemos los clientIds del gimnasio
        const gymClients = await this.usersRepo.find({
          where: { gymId, role: RoleEnum.CLIENT },
          select: ['id'],
        });
        const clientIds = gymClients.map(u => u.id);
        if (clientIds.length === 0) continue;

        // membresías que vencen ese día para clientes de este gimnasio
        const mems = await this.memRepo.find({
          where: { endsOn: targetISO, clientId: In(clientIds) },
          select: ['id', 'clientId', 'planId'],
        });
        if (mems.length === 0) continue;

        // Evitar duplicados (ya enviado ese d para esa membership)
        const already = await this.remRepo.find({
          where: { gymId, membershipId: In(mems.map(m => m.id)), daysBefore: d },
          select: ['membershipId'],
        });
        const sentSet = new Set(already.map(r => r.membershipId));

        // Pre-cargar nombres de planes para evitar N+1
        const planIds = Array.from(new Set(mems.map(m => m.planId).filter(Boolean))) as string[];
        const plans = planIds.length
          ? await this.plansRepo.find({ where: { id: In(planIds), gymId }, select: ['id', 'name'] })
          : [];
        const planMap = new Map(plans.map(p => [p.id, p.name]));

        for (const m of mems) {
          if (sentSet.has(m.id)) continue;

          const user = await this.usersRepo.findOne({
            where: { id: m.clientId, gymId, role: RoleEnum.CLIENT },
            select: ['id', 'fullName', 'email'],
          });
          if (!user?.email) continue;

          const planName = (m.planId && planMap.get(m.planId)) || 'Tu plan';

          const html = this.interpolate(tpl.html, {
            nombre: user.fullName ?? 'Cliente',
            plan: planName,
            fecha_vencimiento: targetISO,
          });

          try {
            const messageId = await this.mailer.send(user.email, tpl.subject, html);
            await this.logRepo.save(this.logRepo.create({
              gymId,
              toEmail: user.email,
              subject: tpl.subject,
              templateId: tpl.id,
              campaignId: null,
              status: EmailLogStatusEnum.SENT,
              providerMessageId: messageId,
              error: null,
            }));
            await this.remRepo.save(this.remRepo.create({
              gymId,
              membershipId: m.id,
              clientId: m.clientId,
              daysBefore: d,
              sentAt: new Date(),
            }));
          } catch (e: any) {
            await this.logRepo.save(this.logRepo.create({
              gymId,
              toEmail: user.email,
              subject: tpl.subject,
              templateId: tpl.id,
              campaignId: null,
              status: EmailLogStatusEnum.FAILED,
              providerMessageId: null,
              error: e?.message ?? String(e),
            }));
          }
        }
      }
    }
  }

  // ---------- Email de Bienvenida ----------
  async sendWelcomeEmail(gymId: string, clientId: string, toEmail: string, clientName: string) {
    const tpl = await this.tplRepo.findOne({
      where: { gymId, isActive: true },
      order: { createdAt: 'DESC' },
    });

    if (!tpl) {
      console.log(`No welcome template found for gym ${gymId}`);
      return; // No hay plantilla activa
    }

    const html = this.interpolate(tpl.html, {
      nombre: clientName || 'Cliente',
    });

    try {
      const messageId = await this.mailer.send(toEmail, tpl.subject, html);
      await this.logRepo.save(this.logRepo.create({
        gymId,
        toEmail,
        subject: tpl.subject,
        templateId: tpl.id,
        campaignId: null,
        status: EmailLogStatusEnum.SENT,
        providerMessageId: messageId,
        error: null,
      }));
    } catch (e: any) {
      await this.logRepo.save(this.logRepo.create({
        gymId,
        toEmail,
        subject: tpl.subject,
        templateId: tpl.id,
        campaignId: null,
        status: EmailLogStatusEnum.FAILED,
        providerMessageId: null,
        error: e?.message ?? String(e),
      }));
      throw e;
    }
  }

  // ---------- Email de Activación de Cuenta ----------
  async sendAccountActivationEmail(
    gymId: string, 
    userId: string, 
    toEmail: string, 
    userName: string,
    activationToken: string
  ) {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const activationLink = `${frontendUrl}/activate/${activationToken}`;

    const subject = '¡Bienvenido a TYME Gym! Activa tu cuenta';
    
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .container {
      background: #f9f9f9;
      padding: 30px;
      border-radius: 10px;
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
    }
    .header h1 {
      color: #2563eb;
      margin: 0;
    }
    .content {
      background: white;
      padding: 25px;
      border-radius: 8px;
      margin-bottom: 20px;
    }
    .button {
      display: inline-block;
      padding: 15px 30px;
      background: #2563eb;
      color: white !important;
      text-decoration: none;
      border-radius: 5px;
      font-weight: bold;
      margin: 20px 0;
    }
    .button:hover {
      background: #1d4ed8;
    }
    .footer {
      text-align: center;
      color: #666;
      font-size: 12px;
      margin-top: 20px;
    }
    .warning {
      background: #fef3c7;
      border-left: 4px solid #f59e0b;
      padding: 12px;
      margin: 15px 0;
      border-radius: 4px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🏋️ TYME Gym</h1>
    </div>
    
    <div class="content">
      <h2>¡Bienvenido/a, ${userName}!</h2>
      
      <p>Tu cuenta ha sido creada exitosamente. Para comenzar a usar nuestra plataforma, necesitas activar tu cuenta y establecer una contraseña segura.</p>
      
      <p><strong>Haz clic en el siguiente botón para activar tu cuenta:</strong></p>
      
      <div style="text-align: center;">
        <a href="${activationLink}" class="button">Activar Mi Cuenta</a>
      </div>
      
      <p>O copia y pega este enlace en tu navegador:</p>
      <p style="word-break: break-all; color: #2563eb;">${activationLink}</p>
      
      <div class="warning">
        <strong>⚠️ Importante:</strong>
        <ul style="margin: 5px 0;">
          <li>Este enlace es válido por <strong>72 horas</strong></li>
          <li>Solo puedes usarlo una vez</li>
          <li>Tu contraseña debe tener al menos 8 caracteres</li>
        </ul>
      </div>
      
      <p>Una vez que actives tu cuenta, podrás:</p>
      <ul>
        <li>✅ Acceder a tu perfil personalizado</li>
        <li>✅ Ver tu historial de asistencia</li>
        <li>✅ Consultar tu plan de entrenamiento</li>
        <li>✅ Revisar tu plan nutricional</li>
        <li>✅ Y mucho más...</li>
      </ul>
      
      <p>¡Nos emociona tenerte en nuestra comunidad!</p>
      
      <p>Saludos,<br><strong>El equipo de TYME Gym</strong></p>
    </div>
    
    <div class="footer">
      <p>Si no creaste esta cuenta, puedes ignorar este correo de manera segura.</p>
      <p>Este es un correo automático, por favor no respondas a este mensaje.</p>
    </div>
  </div>
</body>
</html>
    `;

    try {
      const messageId = await this.mailer.send(toEmail, subject, html);
      await this.logRepo.save(this.logRepo.create({
        gymId,
        toEmail,
        subject,
        templateId: null,
        campaignId: null,
        status: EmailLogStatusEnum.SENT,
        providerMessageId: messageId,
        error: null,
      }));
      
      console.log(`✅ Activation email sent to ${toEmail}`);
    } catch (e: any) {
      await this.logRepo.save(this.logRepo.create({
        gymId,
        toEmail,
        subject,
        templateId: null,
        campaignId: null,
        status: EmailLogStatusEnum.FAILED,
        providerMessageId: null,
        error: e?.message ?? String(e),
      }));
      
      console.error(`❌ Failed to send activation email to ${toEmail}:`, e);
      throw e;
    }
  }

  // ---------- Email de Confirmación de Pago ----------
  async sendPaymentConfirmation(
    gymId: string,
    clientId: string,
    toEmail: string,
    clientName: string,
    planName: string,
    amount: number,
    paymentDate: string,
  ) {
    const tpl = await this.tplRepo.findOne({
      where: { gymId, isActive: true },
      order: { createdAt: 'DESC' },
    });

    if (!tpl) {
      console.log(`No payment confirmation template found for gym ${gymId}`);
      return; // No hay plantilla activa
    }

    // Calcular fecha de vencimiento (30 días desde hoy, ejemplo)
    const today = new Date();
    const newExpiry = new Date(today);
    newExpiry.setDate(newExpiry.getDate() + 30);
    const newExpiryStr = newExpiry.toISOString().slice(0, 10);

    const html = this.interpolate(tpl.html, {
      nombre: clientName || 'Cliente',
      plan: planName,
      monto: amount.toString(),
      fecha_pago: paymentDate,
      nueva_fecha_vencimiento: newExpiryStr,
    });

    try {
      const messageId = await this.mailer.send(toEmail, tpl.subject, html);
      await this.logRepo.save(this.logRepo.create({
        gymId,
        toEmail,
        subject: tpl.subject,
        templateId: tpl.id,
        campaignId: null,
        status: EmailLogStatusEnum.SENT,
        providerMessageId: messageId,
        error: null,
      }));
    } catch (e: any) {
      await this.logRepo.save(this.logRepo.create({
        gymId,
        toEmail,
        subject: tpl.subject,
        templateId: tpl.id,
        campaignId: null,
        status: EmailLogStatusEnum.FAILED,
        providerMessageId: null,
        error: e?.message ?? String(e),
      }));
      throw e;
    }
  }

  // ---------- Email Logs ----------
  async getEmailLogs(
    gymId: number,
    filters?: {
      status?: 'sent' | 'failed' | 'pending';
      startDate?: string;
      endDate?: string;
      search?: string;
    },
  ) {
    try {
      const query = this.logRepo
        .createQueryBuilder('log')
        .where('log.gymId = :gymId', { gymId: String(gymId) })
        .orderBy('log.createdAt', 'DESC');

      if (filters?.status) {
        query.andWhere('log.status = :status', { status: filters.status });
      }

      if (filters?.startDate) {
        query.andWhere('log.createdAt >= :startDate', { startDate: new Date(filters.startDate) });
      }

      if (filters?.endDate) {
        query.andWhere('log.createdAt <= :endDate', { endDate: new Date(filters.endDate) });
      }

      if (filters?.search) {
        query.andWhere(
          '(log.toEmail ILIKE :search OR log.subject ILIKE :search OR log.error ILIKE :search)',
          { search: `%${filters.search}%` },
        );
      }

      return await query.getMany();
    } catch (error) {
      console.error('Error getting email logs:', error);
      // Retornar array vacío si hay error
      return [];
    }
  }

  async getEmailLogStats(gymId: number) {
    try {
      const logs = await this.logRepo.find({ where: { gymId: String(gymId) } });
      
      return {
        total: logs.length,
        sent: logs.filter(l => l.status === EmailLogStatusEnum.SENT).length,
        failed: logs.filter(l => l.status === EmailLogStatusEnum.FAILED).length,
        pending: logs.filter(l => l.status === EmailLogStatusEnum.PENDING).length,
      };
    } catch (error) {
      console.error('Error getting email log stats:', error);
      // Retornar valores por defecto si hay error
      return {
        total: 0,
        sent: 0,
        failed: 0,
        pending: 0,
      };
    }
  }

  async getEmailLogById(gymId: number, id: string) {
    const log = await this.logRepo.findOne({ where: { id, gymId: String(gymId) } });
    if (!log) {
      throw new NotFoundException(`Email log ${id} not found`);
    }
    return log;
  }
}
