// src/communications/mailer/ses-mailer.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  SESv2Client,
  SendEmailCommand,
  SendBulkEmailCommand,
  BulkEmailEntry,
  Message,
  Content,
  EmailContent,
  Destination,
} from '@aws-sdk/client-sesv2';

@Injectable()
export class SesMailerService {
  private readonly logger = new Logger(SesMailerService.name);
  private readonly client: SESv2Client;
  private readonly region: string;
  private readonly source: string;
  private readonly replyTo?: string;
  private readonly dryRun: boolean;

  constructor(private readonly config: ConfigService) {
    this.region = this.config.get<string>('AWS_REGION') || 'us-east-1';
    this.source = this.config.get<string>('SES_SOURCE_EMAIL') || 'no-reply@example.com';
    this.replyTo = this.config.get<string>('SES_REPLY_TO') || undefined;
    this.dryRun = (this.config.get<string>('EMAIL_DRY_RUN') || 'false').toLowerCase() === 'true';

    // Credenciales: usa env (AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY) o provider chain.
    this.client = new SESv2Client({ region: this.region });
  }

  private buildMessage(subject: string, html: string, text?: string): Message {
    const subj: Content = { Data: subject, Charset: 'UTF-8' };
    const htmlC: Content = { Data: html, Charset: 'UTF-8' };
    const textC: Content | undefined = text ? { Data: text, Charset: 'UTF-8' } : undefined;

    return {
      Subject: subj,
      Body: {
        Html: htmlC,
        ...(textC ? { Text: textC } : {}),
      },
    };
  }

  /**
   * Envía un correo a un destinatario.
   * Devuelve el MessageId del proveedor (SES).
   */
  async send(to: string, subject: string, html: string, text?: string): Promise<string> {
    if (!to) throw new Error('Destinatario vacío');
    if (this.dryRun) {
      this.logger.log(`[DRY RUN] send → to=${to} subj="${subject}"`);
      return 'dry-run-message-id';
    }

    const destination: Destination = { ToAddresses: [to] };
    const message = this.buildMessage(subject, html, text);
    const content: EmailContent = { Simple: message };

    const cmd = new SendEmailCommand({
      FromEmailAddress: this.source,
      Destination: destination,
      Content: content,
      ...(this.replyTo ? { ReplyToAddresses: [this.replyTo] } : {}),
    });

    const res = await this.client.send(cmd);
    const id = res.MessageId || 'unknown-message-id';
    this.logger.debug(`SES sent: ${id} → ${to}`);
    return id;
  }

  /**
   * Envío masivo simple (mismo asunto/html a muchos destinatarios).
   * - SES limita a 50 entradas por llamada → se hace chunking automático.
   * - Usa DefaultContent (requerido por SendBulkEmail) y sólo Destination por entry.
   * Devuelve: arreglo con { to, messageId, status, error }.
   */
  async sendBulk(toList: string[], subject: string, html: string, text?: string) {
    if (!toList?.length) return [];
    if (this.dryRun) {
      this.logger.log(`[DRY RUN] sendBulk → n=${toList.length} subj="${subject}"`);
      return toList.map((to) => ({ to, messageId: 'dry-run-message-id', status: 'DRY_RUN', error: null as string | null }));
    }

    const message = this.buildMessage(subject, html, text);
    const defaultContent: EmailContent = { Simple: message };

    // SES: máximo 50 entradas por request
    const CHUNK = 50;
    const chunks: string[][] = [];
    for (let i = 0; i < toList.length; i += CHUNK) {
      chunks.push(toList.slice(i, i + CHUNK));
    }

    const allResults: Array<{ to: string; messageId: string | null; status: string; error: string | null }> = [];

    for (const chunk of chunks) {
      const entries: BulkEmailEntry[] = chunk.map((to) => ({
        Destination: { ToAddresses: [to] },
        // Opcional: ReplacementEmailContent si quisieras personalizar por destinatario.
      }));

      const cmd = new SendBulkEmailCommand({
        FromEmailAddress: this.source,
        DefaultContent: defaultContent, // <- requerido por la API
        BulkEmailEntries: entries,
        ...(this.replyTo ? { ReplyToAddresses: [this.replyTo] } : {}),
      });

      const res = await this.client.send(cmd);

      // Mapear resultados por índice (SES mantiene orden correlativo de entradas)
      const results = (res?.BulkEmailEntryResults || []).map((r, idx) => ({
        to: chunk[idx],
        messageId: r?.MessageId || null,
        status: r?.Status || 'UNKNOWN',
        error: r?.Error || null,
      }));

      // Log de fallos (si los hay)
      for (const r of results) {
        if (r.status !== 'SUCCESS') {
          this.logger.warn(`SES bulk fail → to=${r.to} status=${r.status} error=${r.error}`);
        }
      }

      allResults.push(...results);
    }

    return allResults;
  }
}
