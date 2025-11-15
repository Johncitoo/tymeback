import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

@Injectable()
export class ResendMailerService {
  private readonly logger = new Logger(ResendMailerService.name);
  private readonly client: Resend;
  private readonly fromEmail: string;
  private readonly replyTo?: string;
  private readonly dryRun: boolean;

  constructor(private readonly config: ConfigService) {
    const apiKey = this.config.get<string>('RESEND_API_KEY');
    
    if (!apiKey) {
      this.logger.warn('⚠️ RESEND_API_KEY no configurado - El servicio de email no funcionará');
      // Crear cliente dummy para evitar errores
      this.client = new Resend('re_dummy_key');
    } else {
      this.client = new Resend(apiKey);
      this.logger.log('✅ Resend inicializado correctamente');
    }

    this.fromEmail = this.config.get<string>('RESEND_FROM_EMAIL') || 'onboarding@resend.dev';
    this.replyTo = this.config.get<string>('RESEND_REPLY_TO');
    this.dryRun = (this.config.get<string>('EMAIL_DRY_RUN') || 'false').toLowerCase() === 'true';

    if (this.dryRun) {
      this.logger.warn('📧 Modo DRY_RUN activado - Los emails NO se enviarán realmente');
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
    if (!to) {
      throw new Error('Destinatario vacío');
    }

    if (this.dryRun) {
      this.logger.log(`[DRY RUN] Email → to=${to} subject="${subject}"`);
      return 'dry-run-message-id';
    }

    try {
      const response = await this.client.emails.send({
        from: this.fromEmail,
        to: [to],
        subject,
        html,
        text,
        ...(this.replyTo ? { reply_to: this.replyTo } : {}),
      });

      if (response.error) {
        this.logger.error(`❌ Error al enviar email a ${to}:`, response.error);
        throw new Error(response.error.message || 'Error al enviar email');
      }

      const messageId = response.data?.id || 'unknown-message-id';
      this.logger.debug(`✅ Email enviado: ${messageId} → ${to}`);
      return messageId;
    } catch (error) {
      this.logger.error(`❌ Error al enviar email a ${to}:`, error);
      throw error;
    }
  }

  /**
   * Envío masivo de emails (mismo contenido a múltiples destinatarios).
   * Resend no tiene API bulk nativa, así que enviamos uno por uno.
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

    // Enviar emails secuencialmente para evitar rate limits
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

      // Pequeña pausa entre emails para evitar rate limits (opcional)
      // Resend tiene límite de 100 emails/segundo en plan gratuito
      await new Promise((resolve) => setTimeout(resolve, 100));
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
    const apiKey = this.config.get<string>('RESEND_API_KEY');

    if (!apiKey || apiKey === 're_dummy_key') {
      return {
        configured: false,
        message: 'RESEND_API_KEY no configurado',
      };
    }

    if (this.dryRun) {
      return {
        configured: true,
        message: 'Resend configurado correctamente (modo DRY_RUN activo)',
      };
    }

    try {
      // Intentar enviar un email de prueba (a ti mismo o usar dry run)
      await this.send(
        'test@resend.dev',
        'Health Check Test',
        '<p>Health check test from TYME Gym</p>',
        'Health check test',
      );

      return {
        configured: true,
        message: 'Resend configurado correctamente',
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        configured: false,
        message: `Error: ${errorMessage}`,
      };
    }
  }

  /**
   * Envía un email con un template personalizado
   * Útil para emails transaccionales con datos dinámicos
   */
  async sendWithTemplate(
    to: string,
    subject: string,
    templateHtml: string,
    variables: Record<string, string | number>,
  ): Promise<string> {
    // Reemplazar variables en el template {variable}
    let html = templateHtml;
    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`{${key}}`, 'g');
      html = html.replace(regex, String(value));
    }

    return this.send(to, subject, html);
  }
}
