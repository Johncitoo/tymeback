import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GmailMailerService } from './gmail-mailer.service';

/**
 * Servicio de email genérico que actúa como fachada para diferentes proveedores
 * Actualmente soporta Gmail SMTP
 */
@Injectable()
export class MailerService {
  private readonly logger = new Logger(MailerService.name);

  constructor(
    private readonly config: ConfigService,
    private readonly gmailService: GmailMailerService,
  ) {
    this.logger.log('✅ Mailer Service inicializado con Gmail SMTP');
  }

  /**
   * Envía un email usando el proveedor configurado
   */
  async send(to: string, subject: string, html: string): Promise<string> {
    try {
      return await this.gmailService.send(to, subject, html);
    } catch (error) {
      this.logger.error(`Error al enviar email a ${to}:`, error);
      throw error;
    }
  }

  /**
   * Envía un email de prueba
   */
  async sendTest(to: string): Promise<string> {
    const subject = 'Test Email - TYME Gym';
    const html = `
      <h1>Email de Prueba</h1>
      <p>Este es un email de prueba del sistema TYME Gym.</p>
      <p>Si recibes este mensaje, el sistema de email está funcionando correctamente.</p>
    `;
    
    return await this.send(to, subject, html);
  }
}
