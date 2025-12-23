import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { AutomatedEmailTemplate, AutomatedEmailType } from './entities/automated-email-template.entity';
import { MassEmail, RecipientFilterType, MassEmailStatus } from './entities/mass-email.entity';
import { UpdateAutomatedEmailDto, SendMassEmailDto } from './dto/automated-emails.dto';
import { MailerService } from './mailer/mailer.service';
import { User } from '../users/entities/user.entity';
import { GymUser } from '../gym-users/entities/gym-user.entity';
import { Membership } from '../memberships/entities/membership.entity';
import { EmailLog, EmailLogStatusEnum } from './entities/email-log.entity';

@Injectable()
export class AutomatedEmailsService {
  constructor(
    @InjectRepository(AutomatedEmailTemplate)
    private readonly templatesRepo: Repository<AutomatedEmailTemplate>,
    @InjectRepository(MassEmail)
    private readonly massEmailsRepo: Repository<MassEmail>,
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
    @InjectRepository(GymUser)
    private readonly gymUsersRepo: Repository<GymUser>,
    @InjectRepository(Membership)
    private readonly membershipsRepo: Repository<Membership>,
    @InjectRepository(EmailLog)
    private readonly emailLogsRepo: Repository<EmailLog>,
    private readonly mailerService: MailerService,
  ) {}

  /**
   * Obtener todas las plantillas de correos automáticos de un gimnasio
   */
  async getAutomatedTemplates(gymId: string): Promise<AutomatedEmailTemplate[]> {
    return this.templatesRepo.find({
      where: { gymId },
      order: { type: 'ASC' },
    });
  }

  /**
   * Obtener una plantilla específica
   */
  async getAutomatedTemplate(gymId: string, type: AutomatedEmailType): Promise<AutomatedEmailTemplate> {
    const template = await this.templatesRepo.findOne({
      where: { gymId, type },
    });

    if (!template) {
      // Crear plantilla por defecto si no existe
      return this.createDefaultTemplate(gymId, type);
    }

    return template;
  }

  /**
   * Actualizar una plantilla automática (solo contenido, NO diseño HTML)
   */
  async updateAutomatedTemplate(
    gymId: string,
    type: AutomatedEmailType,
    dto: UpdateAutomatedEmailDto,
  ): Promise<AutomatedEmailTemplate> {
    let template = await this.templatesRepo.findOne({
      where: { gymId, type },
    });

    if (!template) {
      template = await this.createDefaultTemplate(gymId, type);
    }

    template.subject = dto.subject;
    template.contentBody = dto.contentBody;
    if (dto.isActive !== undefined) {
      template.isActive = dto.isActive;
    }

    return this.templatesRepo.save(template);
  }

  /**
   * Enviar correo masivo con filtros
   */
  async sendMassEmail(gymId: string, userId: string, dto: SendMassEmailDto): Promise<MassEmail> {
    // 1. Crear registro de envío masivo
    const massEmail = this.massEmailsRepo.create({
      gymId,
      createdByUserId: userId,
      subject: dto.subject,
      contentBody: dto.contentBody,
      filterType: dto.filterType as RecipientFilterType,
      filterParams: {
        userIds: dto.userIds,
        membershipIds: dto.membershipIds,
        gender: dto.gender,
        isActive: dto.isActive,
      },
      status: MassEmailStatus.DRAFT,
    });

    const saved = await this.massEmailsRepo.save(massEmail);

    // 2. Obtener destinatarios según filtros
    const recipients = await this.getRecipients(gymId, dto);

    saved.totalRecipients = recipients.length;
    await this.massEmailsRepo.save(saved);

    // 3. Enviar emails en segundo plano
    this.sendEmailsInBackground(saved.id, recipients, dto.subject, dto.contentBody);

    return saved;
  }

  /**
   * Obtener destinatarios según filtros
   */
  async getRecipients(gymId: string, dto: SendMassEmailDto): Promise<User[]> {
    let query = this.usersRepo
      .createQueryBuilder('user')
      .innerJoin('gym_users', 'gu', 'gu.user_id = user.id AND gu.gym_id = :gymId', { gymId })
      .where('gu.role = :role', { role: 'CLIENT' });

    // Filtro por todos los usuarios (sin filtro de activo/inactivo)
    if (dto.filterType === 'ALL_USERS') {
      // No aplicar filtro de is_active, traer todos
    }
    // Filtro por estado activo/inactivo
    else if (dto.filterType === 'ALL_ACTIVE') {
      query = query.andWhere('user.is_active = true');
    } else if (dto.filterType === 'ALL_INACTIVE') {
      query = query.andWhere('user.is_active = false');
    }
    // Filtro por usuarios específicos
    else if (dto.filterType === 'SPECIFIC_USERS' && dto.userIds && dto.userIds.length > 0) {
      query = query.andWhere('user.id IN (:...userIds)', { userIds: dto.userIds });
    }
    // Filtro por membresía
    else if (dto.filterType === 'BY_MEMBERSHIP' && dto.membershipIds && dto.membershipIds.length > 0) {
      query = query
        .innerJoin('memberships', 'm', 'm.client_gym_user_id = gu.id')
        .andWhere('m.plan_id IN (:...membershipIds)', { membershipIds: dto.membershipIds });
    }
    // Filtro por género
    else if (dto.filterType === 'BY_GENDER' && dto.gender) {
      query = query.andWhere('user.gender = :gender', { gender: dto.gender });
    }
    // Filtros personalizados
    else if (dto.filterType === 'CUSTOM') {
      if (dto.gender) {
        query = query.andWhere('user.gender = :gender', { gender: dto.gender });
      }
      if (dto.isActive !== undefined) {
        query = query.andWhere('user.is_active = :isActive', { isActive: dto.isActive });
      }
      if (dto.membershipIds && dto.membershipIds.length > 0) {
        query = query
          .innerJoin('memberships', 'm', 'm.client_gym_user_id = gu.id')
          .andWhere('m.plan_id IN (:...membershipIds)', { membershipIds: dto.membershipIds });
      }
    }

    return query.getMany();
  }

  /**
   * Enviar emails en segundo plano
   */
  private async sendEmailsInBackground(
    massEmailId: string,
    recipients: User[],
    subject: string,
    contentBody: string,
  ): Promise<void> {
    const massEmail = await this.massEmailsRepo.findOne({ where: { id: massEmailId } });
    if (!massEmail) return;

    massEmail.status = MassEmailStatus.SENDING;
    await this.massEmailsRepo.save(massEmail);

    let sentCount = 0;
    let failedCount = 0;

    for (const recipient of recipients) {
      if (!recipient.email) {
        failedCount++;
        continue;
      }

      try {
        const html = this.buildEmailHtml(subject, contentBody);
        const result = await this.mailerService.send(recipient.email, subject, html);

        try {
          await this.emailLogsRepo.save({
            gymId: massEmail.gymId,
            toEmail: recipient.email,
            subject,
            status: EmailLogStatusEnum.SENT,
            providerMessageId: result?.messageId || null,
            templateId: null,
            error: null,
          });
        } catch (logError) {
          console.error(`Error guardando log para ${recipient.email}:`, logError);
        }

        sentCount++;
      } catch (error) {
        console.error(`Error enviando email a ${recipient.email}:`, error);
        failedCount++;

        try {
          await this.emailLogsRepo.save({
            gymId: massEmail.gymId,
            toEmail: recipient.email,
            subject,
            status: EmailLogStatusEnum.FAILED,
            providerMessageId: null,
            templateId: null,
            error: error instanceof Error ? error.message : String(error),
          });
        } catch (logError) {
          console.error(`Error guardando log de fallo para ${recipient.email}:`, logError);
        }
      }
    }

    massEmail.sentCount = sentCount;
    massEmail.failedCount = failedCount;
    massEmail.status = failedCount === 0 ? MassEmailStatus.SENT : MassEmailStatus.FAILED;
    massEmail.sentAt = new Date();
    await this.massEmailsRepo.save(massEmail);
  }

  /**
   * Construir HTML del email (plantilla fija, solo cambia el contenido)
   */
  private buildEmailHtml(subject: string, contentBody: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>${subject}</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 24px;">${subject}</h1>
        </div>
        
        <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb;">
          <div style="white-space: pre-wrap;">${contentBody}</div>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
            <p style="font-size: 14px; color: #6b7280; margin: 0;">
              Saludos,<br/>
              <strong>Equipo del Gimnasio</strong>
            </p>
          </div>
        </div>
        
        <div style="text-align: center; margin-top: 20px; font-size: 12px; color: #9ca3af;">
          <p>Este es un mensaje automático, por favor no respondas a este correo.</p>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Crear plantilla por defecto según tipo
   */
  private async createDefaultTemplate(
    gymId: string,
    type: AutomatedEmailType,
  ): Promise<AutomatedEmailTemplate> {
    const defaults = this.getDefaultTemplateContent(type);

    const template = this.templatesRepo.create({
      gymId,
      type,
      name: defaults.name,
      subject: defaults.subject,
      contentBody: defaults.contentBody,
      availableVariables: defaults.variables,
      isActive: true,
    });

    return this.templatesRepo.save(template);
  }

  /**
   * Obtener contenido por defecto según tipo de correo
   */
  private getDefaultTemplateContent(type: AutomatedEmailType): {
    name: string;
    subject: string;
    contentBody: string;
    variables: Record<string, string>;
  } {
    switch (type) {
      case AutomatedEmailType.PASSWORD_RESET:
        return {
          name: 'Recuperación de Contraseña',
          subject: 'Recuperación de Contraseña',
          contentBody:
            'Hola {nombre},\n\nHemos recibido una solicitud para restablecer tu contraseña.\n\nHaz clic en el siguiente enlace para crear una nueva contraseña:\n{resetLink}\n\nEste enlace expirará en 1 hora.\n\nSi no solicitaste este cambio, puedes ignorar este mensaje.',
          variables: { nombre: 'Nombre del usuario', resetLink: 'Enlace de recuperación' },
        };

      case AutomatedEmailType.PAYMENT_CONFIRMATION:
        return {
          name: 'Confirmación de Pago',
          subject: '✅ Confirmación de Pago',
          contentBody:
            'Hola {nombre},\n\nTu pago ha sido procesado exitosamente.\n\nPlan: {plan}\nMonto: {monto} CLP\nFecha: {fecha}\n\n¡Tu membresía está activa! Ya puedes disfrutar de todos los beneficios.',
          variables: { nombre: 'Nombre del usuario', plan: 'Nombre del plan', monto: 'Monto pagado', fecha: 'Fecha del pago' },
        };

      case AutomatedEmailType.MEMBERSHIP_EXPIRATION:
        return {
          name: 'Recordatorio de Vencimiento',
          subject: '⏰ Tu Membresía Vence Pronto',
          contentBody:
            'Hola {nombre},\n\nTu membresía "{plan}" vence en {dias} días (el {fecha}).\n\nPara continuar disfrutando de nuestros servicios, recuerda renovar tu membresía antes del vencimiento.\n\n¡Te esperamos!',
          variables: { nombre: 'Nombre del usuario', plan: 'Nombre del plan', dias: 'Días restantes', fecha: 'Fecha de vencimiento' },
        };

      case AutomatedEmailType.WELCOME:
        return {
          name: 'Bienvenida',
          subject: '🎉 ¡Bienvenido a Nuestro Gimnasio!',
          contentBody:
            'Hola {nombre},\n\n¡Bienvenido a nuestra familia!\n\nEstamos emocionados de tenerte con nosotros. Tu cuenta ha sido creada exitosamente.\n\nPuedes iniciar sesión en nuestra plataforma con tu email y la contraseña que elegiste.\n\n¡Nos vemos en el gimnasio!',
          variables: { nombre: 'Nombre del usuario' },
        };

      case AutomatedEmailType.ACCOUNT_INACTIVE:
        return {
          name: 'Cuenta Inactiva',
          subject: '⚠️ Tu Cuenta Está Inactiva',
          contentBody:
            'Hola {nombre},\n\nTu cuenta se encuentra temporalmente inactiva debido a que tu membresía ha vencido y no se ha registrado un nuevo pago.\n\nPara reactivar tu cuenta y continuar accediendo a nuestros servicios, por favor realiza el pago de tu membresía.\n\nSi ya realizaste el pago, este mensaje se actualizará automáticamente en las próximas horas.\n\nPara más información, contáctanos.',
          variables: { nombre: 'Nombre del usuario' },
        };

      default:
        return {
          name: 'Plantilla Genérica',
          subject: 'Notificación',
          contentBody: 'Hola {nombre},\n\n[Contenido del mensaje]',
          variables: { nombre: 'Nombre del usuario' },
        };
    }
  }

  /**
   * Obtener historial de envíos masivos
   */
  async getMassEmailHistory(gymId: string): Promise<MassEmail[]> {
    return this.massEmailsRepo.find({
      where: { gymId },
      order: { createdAt: 'DESC' },
      take: 50,
    });
  }
}
