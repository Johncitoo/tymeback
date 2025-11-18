import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TransactionalEmailsApi, SendSmtpEmail } from '@getbrevo/brevo';

/**
 * Servicio de email usando Brevo API (HTTP)
 * Compatible con Railway - no usa SMTP
 */
@Injectable()
export class BrevoMailerService {
  private readonly logger = new Logger(BrevoMailerService.name);
  private readonly apiInstance: TransactionalEmailsApi;
  private readonly fromEmail: string;
  private readonly fromName: string;
  private readonly dryRun: boolean;

  constructor(private readonly config: ConfigService) {
    const apiKey = this.config.get<string>('BREVO_API_KEY') || '';
    
    console.log('📧 Brevo API Configuration:', {
      apiKey: apiKey ? `${apiKey.substring(0, 15)}***` : 'NOT SET',
    });

    if (!apiKey) {
      this.logger.error('❌ BREVO_API_KEY no configurada - El servicio de email NO funcionará');
      this.logger.error('❌ Genera una API Key en Brevo → API Keys → Create a new API key');
    }

    // Configurar Brevo API - La API key se configura directamente en la instancia
    this.apiInstance = new TransactionalEmailsApi();
    this.apiInstance.setApiKey(0, apiKey); // 0 = apiKey enum value
    
    this.fromEmail = this.config.get<string>('EMAIL_FROM_ADDRESS') || 'juan.contreras03@alumnos.ucn.cl';
    this.fromName = this.config.get<string>('EMAIL_FROM_NAME') || 'TYME Gym';
    this.dryRun = (this.config.get<string>('EMAIL_DRY_RUN') || 'false').toLowerCase() === 'true';

    console.log('📧 Email settings:', {
      fromEmail: this.fromEmail,
      fromName: this.fromName,
      dryRun: this.dryRun,
      provider: 'Brevo API (HTTP)',
    });

    if (this.dryRun) {
      this.logger.warn('📧 Modo DRY_RUN activado - Los emails NO se enviarán realmente');
    } else if (apiKey) {
      this.logger.log('✅ Brevo API inicializada correctamente');
    }
  }

  async send(to: string, subject: string, html: string, text?: string): Promise<string> {
    console.log('📬 BrevoMailerService.send - START');
    console.log('📬 to:', to);
    console.log('📬 subject:', subject);
    
    if (!to) {
      throw new Error('Destinatario vacío');
    }

    if (this.dryRun) {
      this.logger.log(`[DRY RUN] Email → to=${to} subject="${subject}"`);
      return 'dry-run-message-id';
    }

    try {
      const sendSmtpEmail: SendSmtpEmail = {
        sender: { name: this.fromName, email: this.fromEmail },
        to: [{ email: to }],
        subject: subject,
        htmlContent: html,
      };
      
      if (text) {
        sendSmtpEmail.textContent = text;
      }

      console.log('📬 Calling Brevo API...');
      const result: any = await this.apiInstance.sendTransacEmail(sendSmtpEmail);
      
      // La API de Brevo retorna el resultado en result.body
      console.log('📬 Brevo API result:', JSON.stringify(result, null, 2));
      console.log('📬 result.body:', result?.body);
      console.log('📬 result.response:', result?.response);
      
      const messageId = result?.body?.messageId || result?.messageId || 'unknown-message-id';
      console.log('✅ Email sent successfully via Brevo API, messageId:', messageId);
      this.logger.log(`✅ Email enviado: ${messageId} → ${to}`);
      
      return String(messageId);
    } catch (error: any) {
      console.error('❌ Error in BrevoMailerService.send:', error);
      console.error('❌ Error response:', error.response?.text || error.message);
      console.error('❌ Error body:', error.body);
      this.logger.error(`❌ Error al enviar email a ${to}:`, error.message);
      throw new Error(error.response?.text || error.message || 'Error sending email');
    }
  }

  async sendTest(to: string): Promise<string> {
    return this.send(
      to,
      'Test Email - TYME Gym',
      '<h1>Test Email</h1><p>Este es un email de prueba desde TYME Gym usando Brevo API</p>',
      'Test Email - Este es un email de prueba desde TYME Gym'
    );
  }

  async sendBulk(
    toList: string[],
    subject: string,
    html: string,
    text?: string,
  ): Promise<Array<{ to: string; messageId: string | null; status: string; error: string | null }>> {
    const results: Array<{ to: string; messageId: string | null; status: string; error: string | null }> = [];
    
    for (const to of toList) {
      try {
        const messageId = await this.send(to, subject, html, text);
        results.push({ to, messageId, status: 'sent', error: null });
      } catch (error: any) {
        results.push({ to, messageId: null, status: 'failed', error: error.message });
      }
    }
    
    return results;
  }
}
