import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

@Injectable()
export class GmailMailerService {
  private readonly logger = new Logger(GmailMailerService.name);
  private readonly transporter: Transporter;
  private readonly fromEmail: string;
  private readonly fromName: string;
  private readonly dryRun: boolean;

  constructor(private readonly config: ConfigService) {
    // Configuración para Brevo (Sendinblue) SMTP
    const user = this.config.get<string>('EMAIL_USER') || this.config.get<string>('BREVO_SMTP_USER') || '';
    const password = this.config.get<string>('EMAIL_PASSWORD') || this.config.get<string>('BREVO_SMTP_KEY') || '';
    const host = this.config.get<string>('EMAIL_HOST') || 'smtp-relay.brevo.com';
    const port = parseInt(this.config.get<string>('EMAIL_PORT') || '587', 10);
    const secure = false; // Brevo usa STARTTLS en puerto 587

    console.log('📧 Brevo SMTP Configuration:', {
      user: user ? `${user.substring(0, 10)}***` : 'NOT SET',
      password: password ? '***SET***' : 'NOT SET',
      host,
      port,
      secure,
    });

    if (!user || !password) {
      this.logger.error('❌ EMAIL_USER/BREVO_SMTP_USER o EMAIL_PASSWORD/BREVO_SMTP_KEY no configurados');
      this.logger.error('❌ El servicio de email NO funcionará hasta que se configuren');
    }

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: {
        user,
        pass: password,
      },
      // Configuración optimizada para Brevo
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 10000,
    });

    this.fromEmail = this.config.get<string>('EMAIL_FROM_ADDRESS') || this.config.get<string>('EMAIL_FROM') || 'juan.contreras03@alumnos.ucn.cl';
    this.fromName = this.config.get<string>('EMAIL_FROM_NAME') || 'TYME Gym';
    this.dryRun = (this.config.get<string>('EMAIL_DRY_RUN') || 'false').toLowerCase() === 'true';

    console.log('📧 Email settings:', {
      fromEmail: this.fromEmail,
      fromName: this.fromName,
      dryRun: this.dryRun,
      provider: 'Brevo (Sendinblue)',
    });

    if (this.dryRun) {
      this.logger.warn('📧 Modo DRY_RUN activado - Los emails NO se enviarán realmente');
    } else if (user && password) {
      this.logger.log('✅ Brevo SMTP inicializado correctamente');
    }
  }

  /**
   * Envía un correo a un destinatario.
   * @param to Email del destinatario
   * @param subject Asunto del email
   * @param html Contenido HTML del email
   * @param text Contenido texto plano (opcional)
   * @returns Promise con el ID del mensaje enviado
   */
  async send(to: string, subject: string, html: string, text?: string): Promise<string> {
    console.log('📬 GmailMailerService.send - START');
    console.log('📬 to:', to);
    console.log('📬 subject:', subject);
    console.log('📬 fromEmail:', this.fromEmail);
    console.log('📬 fromName:', this.fromName);
    console.log('📬 dryRun:', this.dryRun);
    
    if (!to) {
      throw new Error('Destinatario vacío');
    }

    if (this.dryRun) {
      this.logger.log(`[DRY RUN] Email → to=${to} subject="${subject}"`);
      return 'dry-run-message-id';
    }

    try {
      console.log('📬 Calling transporter.sendMail...');
      console.log('📬 Transporter config:', {
        from: `"${this.fromName}" <${this.fromEmail}>`,
        to,
        subject,
      });
      
      const info = await this.transporter.sendMail({
        from: `"${this.fromName}" <${this.fromEmail}>`,
        to,
        subject,
        html,
        text: text || undefined,
      });

      const messageId = info.messageId || 'unknown-message-id';
      console.log('✅ Email sent successfully:', messageId);
      this.logger.debug(`✅ Email enviado: ${messageId} → ${to}`);
      return messageId;
    } catch (error) {
      console.error('❌ Error in GmailMailerService.send:', error);
      console.error('❌ Error code:', error.code);
      console.error('❌ Error response:', error.response);
      this.logger.error(`❌ Error al enviar email a ${to}:`, error);
      throw error;
    }
  }

  /**
   * Envío masivo de emails (mismo contenido a múltiples destinatarios).
   * @param toList Lista de emails destinatarios
   * @param subject Asunto del email
   * @param html Contenido HTML
   * @param text Contenido texto plano (opcional)
   * @returns Array con resultados de cada envío
   */
  async sendBulk(
    toList: string[],
    subject: string,
    html: string,
    text?: string,
  ): Promise<Array<{ to: string; messageId: string | null; status: string; error: string | null }>> {
    if (!toList?.length) {
      return [];
    }

    if (this.dryRun) {
      this.logger.log(`[DRY RUN] Bulk Email → n=${toList.length} subject="${subject}"`);
      return toList.map((to) => ({
        to,
        messageId: 'dry-run-message-id',
        status: 'DRY_RUN',
        error: null,
      }));
    }

    const results: Array<{ to: string; messageId: string | null; status: string; error: string | null }> = [];

    // Enviar emails secuencialmente para evitar rate limits de Gmail
    for (const to of toList) {
      try {
        const messageId = await this.send(to, subject, html, text);
        results.push({
          to,
          messageId,
          status: 'SUCCESS',
          error: null,
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        this.logger.error(`❌ Error enviando a ${to}:`, errorMessage);
        results.push({
          to,
          messageId: null,
          status: 'FAILED',
          error: errorMessage,
        });
      }

      // Pausa entre emails para evitar rate limits de Gmail (500 emails/día en cuentas gratuitas)
      await new Promise((resolve) => setTimeout(resolve, 200));
    }

    const successCount = results.filter((r) => r.status === 'SUCCESS').length;
    const failCount = results.filter((r) => r.status === 'FAILED').length;
    this.logger.log(`📊 Bulk send completado: ${successCount} exitosos, ${failCount} fallidos de ${toList.length} totales`);

    return results;
  }

  /**
   * Verifica si el servicio está configurado correctamente
   */
  async healthCheck(): Promise<{ configured: boolean; message: string }> {
    const user = this.config.get<string>('EMAIL_USER');
    const password = this.config.get<string>('EMAIL_PASSWORD');

    if (!user || !password) {
      return {
        configured: false,
        message: 'EMAIL_USER o EMAIL_PASSWORD no configurados',
      };
    }

    try {
      await this.transporter.verify();
      return {
        configured: true,
        message: 'Gmail SMTP conectado correctamente',
      };
    } catch (error) {
      return {
        configured: false,
        message: `Error de conexión: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }
}
