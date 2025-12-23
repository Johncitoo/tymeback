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
import { GymUser } from '../gym-users/entities/gym-user.entity';

@Injectable()
export class CommunicationsService {
  constructor(
    @InjectRepository(EmailTemplate) private readonly tplRepo: Repository<EmailTemplate>,
    @InjectRepository(EmailCampaign) private readonly campRepo: Repository<EmailCampaign>,
    @InjectRepository(CampaignRecipient) private readonly recRepo: Repository<CampaignRecipient>,
    @InjectRepository(EmailLog) private readonly logRepo: Repository<EmailLog>,
    @InjectRepository(MembershipReminder) private readonly remRepo: Repository<MembershipReminder>,
    @InjectRepository(User) private readonly usersRepo: Repository<User>,
    @InjectRepository(GymUser) private readonly gymUsersRepo: Repository<GymUser>,
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
    console.log('📧 CommunicationsService.sendTest - START');
    console.log('📧 gymId:', gymId);
    console.log('📧 dto:', dto);
    
    try {
      console.log('📧 Calling mailer.send...');
      const messageId = await this.mailer.send(dto.to, dto.subject, dto.html);
      console.log('📧 Email sent, messageId:', messageId);
      
      console.log('📧 Saving email log...');
      await this.logRepo.save(this.logRepo.create({
        gymId,
        toEmail: dto.to,
        subject: dto.subject,
        templateId: null,
        status: EmailLogStatusEnum.SENT,
        providerMessageId: messageId,
        error: null,
      }));
      console.log('✅ sendTest completed successfully');
      
      return { ok: true, messageId };
    } catch (error) {
      console.error('❌ Error in sendTest:', error);
      console.error('❌ Error stack:', error.stack);
      throw error;
    }
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
    // Obtener usuarios con membresía CLIENT en este gimnasio via gym_users
    const gymUsers = await this.gymUsersRepo.find({
      where: { gymId, role: RoleEnum.CLIENT, isActive: true },
      select: ['id', 'userId'],
    });
    const userIds = gymUsers.map(gu => gu.userId);
    if (userIds.length === 0) return [];

    const users = await this.usersRepo.find({ where: { id: In(userIds) } });
    
    // Crear mapa gymUserId -> userId
    const gymUserMap = new Map(gymUsers.map(gu => [gu.userId, gu.id]));

    // Asegurar email:string (no null) con type guard
    const candidates: Array<{ clientId: string; clientGymUserId: string; email: string }> = users
      .filter((u): u is User & { email: string } => !!u.email)
      .map(u => ({ clientId: u.id, clientGymUserId: gymUserMap.get(u.id)!, email: u.email }));

    if (filters?.activeOnly) {
      const today = this.todayISO();
      const activeMems = await this.memRepo.find({
        where: { startsOn: LessThanOrEqual(today), endsOn: MoreThanOrEqual(today) },
        select: ['clientGymUserId'],
      });
      const activeSet = new Set(activeMems.map(m => m.clientGymUserId));
      return candidates.filter(c => activeSet.has(c.clientGymUserId));
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

        // Primero obtenemos los clientIds del gimnasio via gym_users
        const gymClients = await this.gymUsersRepo.find({
          where: { gymId, role: RoleEnum.CLIENT },
          select: ['userId'],
        });
        const clientIds = gymClients.map(gu => gu.userId);
        if (clientIds.length === 0) continue;

        // membresías que vencen ese día para clientes de este gimnasio
        const mems = await this.memRepo.find({
          where: { endsOn: targetISO, clientGymUserId: In(clientIds) },
          select: ['id', 'clientGymUserId', 'planId'],
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

          // Validar que el usuario pertenece al gimnasio (clientGymUserId ya es el gym_user id)
          const gymUser = await this.gymUsersRepo.findOne({
            where: { id: m.clientGymUserId, gymId, role: RoleEnum.CLIENT },
          });
          if (!gymUser) continue;

          const user = await this.usersRepo.findOne({
            where: { id: gymUser.userId },
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
              status: EmailLogStatusEnum.SENT,
              providerMessageId: messageId,
              error: null,
            }));
            await this.remRepo.save(this.remRepo.create({
              gymId,
              membershipId: m.id,
              clientId: m.clientGymUserId,
              daysBefore: d,
              sentAt: new Date(),
            }));
          } catch (e: any) {
            await this.logRepo.save(this.logRepo.create({
              gymId,
              toEmail: user.email,
              subject: tpl.subject,
              templateId: tpl.id,
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
        status: EmailLogStatusEnum.FAILED,
        providerMessageId: null,
        error: e?.message ?? String(e),
      }));
      
      console.error(`❌ Failed to send activation email to ${toEmail}:`, e);
      throw e;
    }
  }

  // ---------- Email de Recuperación de Contraseña ----------
  async sendPasswordResetEmail(
    gymId: string,
    userId: string,
    toEmail: string,
    userName: string,
    resetToken: string,
  ) {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const resetLink = `${frontendUrl}/reset-password/${resetToken}`;

    const subject = 'Recuperación de Contraseña - TYME Gym';
    
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
      color: #dc2626;
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
      background: #dc2626;
      color: white !important;
      text-decoration: none;
      border-radius: 5px;
      font-weight: bold;
      margin: 20px 0;
    }
    .button:hover {
      background: #b91c1c;
    }
    .footer {
      text-align: center;
      color: #666;
      font-size: 12px;
      margin-top: 20px;
    }
    .warning {
      background: #fef2f2;
      border-left: 4px solid #dc2626;
      padding: 12px;
      margin: 15px 0;
      border-radius: 4px;
    }
    .security-notice {
      background: #eff6ff;
      border-left: 4px solid #3b82f6;
      padding: 12px;
      margin: 15px 0;
      border-radius: 4px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🔒 TYME Gym</h1>
    </div>
    
    <div class="content">
      <h2>Recuperación de Contraseña</h2>
      
      <p>Hola <strong>${userName}</strong>,</p>
      
      <p>Hemos recibido una solicitud para restablecer la contraseña de tu cuenta.</p>
      
      <p><strong>Haz clic en el siguiente botón para crear una nueva contraseña:</strong></p>
      
      <div style="text-align: center;">
        <a href="${resetLink}" class="button">Restablecer Mi Contraseña</a>
      </div>
      
      <p>O copia y pega este enlace en tu navegador:</p>
      <p style="word-break: break-all; color: #dc2626;">${resetLink}</p>
      
      <div class="warning">
        <strong>⏱️ Importante:</strong>
        <ul style="margin: 5px 0;">
          <li>Este enlace es válido por <strong>1 hora</strong></li>
          <li>Solo puedes usarlo una vez</li>
          <li>Después expirará por seguridad</li>
        </ul>
      </div>
      
      <div class="security-notice">
        <strong>🛡️ Seguridad:</strong>
        <p style="margin: 5px 0;">Si NO solicitaste este cambio de contraseña, por favor <strong>ignora este correo</strong>. Tu cuenta permanecerá segura y nadie podrá cambiar tu contraseña sin este enlace.</p>
      </div>
      
      <p>Saludos,<br><strong>El equipo de TYME Gym</strong></p>
    </div>
    
    <div class="footer">
      <p>Este correo fue enviado porque alguien solicitó restablecer la contraseña de esta cuenta.</p>
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
        status: EmailLogStatusEnum.SENT,
        providerMessageId: messageId,
        error: null,
      }));
      
      console.log(`✅ Password reset email sent to ${toEmail}`);
    } catch (e: any) {
      await this.logRepo.save(this.logRepo.create({
        gymId,
        toEmail,
        subject,
        templateId: null,
        status: EmailLogStatusEnum.FAILED,
        providerMessageId: null,
        error: e?.message ?? String(e),
      }));
      
      console.error(`❌ Failed to send password reset email to ${toEmail}:`, e);
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
    discountClp?: number,
    promotionName?: string,
  ) {
    // Calcular fecha de vencimiento (30 días desde hoy, ejemplo)
    const today = new Date();
    const newExpiry = new Date(today);
    newExpiry.setDate(newExpiry.getDate() + 30);
    const newExpiryStr = newExpiry.toISOString().slice(0, 10);

    const originalAmount = discountClp ? amount + discountClp : amount;
    const discountText = discountClp
      ? `<p style="color: #10b981; font-weight: bold;">Descuento aplicado${promotionName ? ` (${promotionName})` : ''}: -${discountClp.toLocaleString('es-CL')} CLP. Precio original: ${originalAmount.toLocaleString('es-CL')} CLP.</p>`
      : '';

    const subject = '✅ Confirmación de Pago - TYME Gym';
    
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Confirmación de Pago</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      margin: 0;
      padding: 40px 20px;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background: white;
      border-radius: 16px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      overflow: hidden;
    }
    .header {
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      color: white;
      padding: 40px 30px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 28px;
      font-weight: 700;
    }
    .icon {
      font-size: 48px;
      margin-bottom: 16px;
    }
    .content {
      padding: 40px 30px;
    }
    .greeting {
      font-size: 18px;
      color: #1f2937;
      margin-bottom: 24px;
    }
    .message {
      font-size: 16px;
      color: #4b5563;
      line-height: 1.6;
      margin-bottom: 32px;
    }
    .details-box {
      background: #f9fafb;
      border-left: 4px solid #10b981;
      border-radius: 8px;
      padding: 24px;
      margin: 24px 0;
    }
    .detail-row {
      display: flex;
      justify-content: space-between;
      padding: 12px 0;
      border-bottom: 1px solid #e5e7eb;
    }
    .detail-row:last-child {
      border-bottom: none;
    }
    .detail-label {
      font-weight: 600;
      color: #6b7280;
      font-size: 14px;
      text-transform: uppercase;
    }
    .detail-value {
      font-weight: 700;
      color: #1f2937;
      font-size: 16px;
    }
    .amount {
      color: #10b981;
      font-size: 24px;
    }
    .footer {
      background: #f9fafb;
      padding: 30px;
      text-align: center;
      color: #6b7280;
      font-size: 14px;
    }
    .button {
      display: inline-block;
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      color: white;
      padding: 14px 32px;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 600;
      margin: 20px 0;
      box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="icon">💰</div>
      <h1>¡Pago Confirmado!</h1>
    </div>
    <div class="content">
      <p class="greeting">Hola <strong>${clientName}</strong>,</p>
      <p class="message">
        Tu pago ha sido procesado exitosamente. A continuación encontrarás los detalles de tu transacción:
      </p>
      
      <div class="details-box">
        <div class="detail-row">
          <span class="detail-label">Plan</span>
          <span class="detail-value">${planName}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Monto</span>
          <span class="detail-value amount">${amount.toLocaleString('es-CL')} CLP</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Fecha de Pago</span>
          <span class="detail-value">${paymentDate}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Nueva Fecha de Vencimiento</span>
          <span class="detail-value">${newExpiryStr}</span>
        </div>
      </div>

      ${discountText}

      <p class="message">
        Gracias por tu confianza. Tu membresía está activa y lista para usar. ¡Nos vemos en el gimnasio! 💪
      </p>
    </div>
    <div class="footer">
      <p><strong>TYME Gym</strong></p>
      <p>Tu salud, nuestra misión</p>
      <p style="margin-top: 16px; font-size: 12px;">
        Si tienes alguna pregunta sobre este pago, por favor contáctanos.
      </p>
    </div>
  </div>
</body>
</html>
    `;

    try {
      const messageId = await this.mailer.send(toEmail, subject, html);
      // Log exitoso (opcional, puede fallar si gymId no existe)
      try {
        await this.logRepo.save(this.logRepo.create({
          gymId,
          toEmail,
          subject,
          templateId: null,
          status: EmailLogStatusEnum.SENT,
          providerMessageId: messageId,
          error: null,
        }));
      } catch (logError) {
        console.log('Error guardando log de correo, pero el correo fue enviado:', logError);
      }
    } catch (e: any) {
      // Intentar guardar log de fallo
      try {
        await this.logRepo.save(this.logRepo.create({
          gymId,
          toEmail,
          subject,
          templateId: null,
          status: EmailLogStatusEnum.FAILED,
          providerMessageId: null,
          error: e?.message ?? String(e),
        }));
      } catch (logError) {
        console.log('Error guardando log de fallo:', logError);
      }
      throw e;
    }
  }

  async sendExpirationReminder(
    gymId: string,
    userId: string,
    userEmail: string,
    userName: string,
    planName: string,
    expiryDate: string,
    daysUntilExpiry: number,
  ): Promise<void> {
    const urgencyColor = daysUntilExpiry === 1 ? '#dc2626' : daysUntilExpiry === 3 ? '#f59e0b' : '#3b82f6';
    const urgencyText = daysUntilExpiry === 1 ? '¡MAÑANA!' : daysUntilExpiry === 3 ? 'en 3 días' : 'en 7 días';

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Recordatorio de Vencimiento de Membresía</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: ${urgencyColor}; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">⏰ Tu Membresía Vence ${urgencyText}</h1>
        </div>
        
        <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb;">
          <p style="font-size: 18px; margin-bottom: 20px;">Hola <strong>${userName}</strong>,</p>
          
          <p>Te recordamos que tu membresía <strong>${planName}</strong> está próxima a vencer.</p>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid ${urgencyColor};">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; font-weight: 600;">Plan:</td>
                <td style="padding: 8px 0;">${planName}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: 600;">Fecha de vencimiento:</td>
                <td style="padding: 8px 0; font-size: 18px; color: ${urgencyColor}; font-weight: 700;">${expiryDate}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: 600;">Días restantes:</td>
                <td style="padding: 8px 0;"><strong>${daysUntilExpiry} día${daysUntilExpiry !== 1 ? 's' : ''}</strong></td>
              </tr>
            </table>
          </div>
          
          <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; color: #92400e;">
              <strong>⚠️ Importante:</strong><br/>
              Para continuar disfrutando de nuestros servicios, recuerda renovar tu membresía antes del vencimiento.
            </p>
          </div>
          
          <p style="margin-top: 30px; font-size: 14px; color: #6b7280;">
            Si ya realizaste tu pago, por favor ignora este mensaje.
          </p>
          
          <p style="margin-top: 20px;">
            ¡Te esperamos!<br/>
            <strong>Equipo del Gimnasio</strong>
          </p>
        </div>
        
        <div style="text-align: center; margin-top: 20px; font-size: 12px; color: #9ca3af;">
          <p>Este es un mensaje automático, por favor no respondas a este correo.</p>
        </div>
      </body>
      </html>
    `;

    await this.mailer.send(
      userEmail,
      `⏰ Tu membresía vence ${urgencyText} - ${planName}`,
      html
    );

    await this.logRepo.save({
      gymId,
      userId,
      recipientEmail: userEmail,
      subject: `Recordatorio de vencimiento - ${planName}`,
      status: EmailLogStatusEnum.SENT,
      sentAt: new Date(),
    });
  }

  // ---------- Email de Membresía Expirada ----------
  async sendMembershipExpiredEmail(
    gymId: string,
    userId: string,
    userEmail: string,
    userName: string,
    planName: string,
    expiryDate: string,
  ): Promise<void> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Membresía Expirada - Renueva Ahora</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
            margin: 0;
            padding: 40px 20px;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            background: white;
            border-radius: 16px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            overflow: hidden;
          }
          .header {
            background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%);
            color: white;
            padding: 40px 30px;
            text-align: center;
          }
          .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: 700;
          }
          .icon {
            font-size: 64px;
            margin-bottom: 16px;
          }
          .content {
            padding: 40px 30px;
          }
          .alert-box {
            background: #fee2e2;
            border-left: 4px solid #dc2626;
            border-radius: 8px;
            padding: 20px;
            margin: 24px 0;
          }
          .alert-box p {
            margin: 0;
            color: #991b1b;
            font-weight: 600;
            font-size: 16px;
          }
          .details-box {
            background: #f9fafb;
            border-radius: 8px;
            padding: 24px;
            margin: 24px 0;
          }
          .detail-row {
            display: flex;
            justify-content: space-between;
            padding: 12px 0;
            border-bottom: 1px solid #e5e7eb;
          }
          .detail-row:last-child {
            border-bottom: none;
          }
          .detail-label {
            font-weight: 600;
            color: #6b7280;
            font-size: 14px;
            text-transform: uppercase;
          }
          .detail-value {
            font-weight: 700;
            color: #1f2937;
            font-size: 16px;
          }
          .cta-button {
            display: inline-block;
            background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%);
            color: white;
            padding: 16px 40px;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 700;
            font-size: 18px;
            margin: 20px 0;
            box-shadow: 0 4px 12px rgba(220, 38, 38, 0.4);
            text-align: center;
          }
          .footer {
            background: #f9fafb;
            padding: 30px;
            text-align: center;
            color: #6b7280;
            font-size: 14px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="icon">🚫</div>
            <h1>Tu Membresía ha Expirado</h1>
          </div>
          <div class="content">
            <p style="font-size: 18px; color: #1f2937; margin-bottom: 24px;">
              Hola <strong>${userName}</strong>,
            </p>
            
            <div class="alert-box">
              <p>
                ⚠️ Tu membresía expiró el <strong>${expiryDate}</strong>.<br/>
                Para continuar usando nuestras instalaciones, es necesario que renueves tu plan.
              </p>
            </div>

            <div class="details-box">
              <div class="detail-row">
                <span class="detail-label">Plan Anterior</span>
                <span class="detail-value">${planName}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Fecha de Vencimiento</span>
                <span class="detail-value" style="color: #dc2626;">${expiryDate}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Estado</span>
                <span class="detail-value" style="color: #dc2626;">❌ EXPIRADA</span>
              </div>
            </div>

            <p style="font-size: 16px; color: #4b5563; line-height: 1.6; margin: 24px 0;">
              No queremos que dejes de entrenar. Acércate a nuestro gimnasio para renovar tu membresía 
              y continuar con tus objetivos de salud y bienestar.
            </p>

            <div style="text-align: center; margin: 32px 0;">
              <div class="cta-button">
                💪 Renovar Membresía
              </div>
            </div>

            <p style="font-size: 14px; color: #6b7280; margin-top: 32px;">
              Si ya realizaste tu renovación, por favor ignora este mensaje. Tu acceso será habilitado una vez 
              procesemos tu pago.
            </p>
          </div>
          <div class="footer">
            <p><strong>TYME Gym</strong></p>
            <p>¡Te extrañamos! Vuelve pronto 💙</p>
            <p style="margin-top: 16px; font-size: 12px;">
              Para más información, visita nuestro gimnasio o contáctanos.
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    try {
      const messageId = await this.mailer.send(
        userEmail,
        `🚫 Tu Membresía ha Expirado - ${planName}`,
        html
      );
      
      try {
        await this.logRepo.save(this.logRepo.create({
          gymId,
          toEmail: userEmail,
          subject: `Membresía expirada - ${planName}`,
          templateId: null,
          status: EmailLogStatusEnum.SENT,
          providerMessageId: messageId,
          error: null,
        }));
      } catch (logError) {
        console.log('Error guardando log de correo expirado:', logError);
      }
    } catch (e: any) {
      try {
        await this.logRepo.save(this.logRepo.create({
          gymId,
          toEmail: userEmail,
          subject: `Membresía expirada - ${planName}`,
          templateId: null,
          status: EmailLogStatusEnum.FAILED,
          providerMessageId: null,
          error: e?.message ?? String(e),
        }));
      } catch (logError) {
        console.log('Error guardando log de fallo:', logError);
      }
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
