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
import { ResendMailerService } from './mailer/resend-mailer.service';
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
    private readonly mailer: ResendMailerService,
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
}
