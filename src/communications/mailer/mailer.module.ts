import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ResendMailerService } from './resend-mailer.service';
import { GmailMailerService } from './gmail-mailer.service';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true })],
  providers: [
    GmailMailerService,
    ResendMailerService,
    {
      provide: ResendMailerService,
      useFactory: (config: ConfigService, gmailService: GmailMailerService) => {
        const provider = config.get<string>('EMAIL_PROVIDER') || 'resend';
        if (provider === 'gmail') {
          // Retornamos el servicio de Gmail pero con el nombre ResendMailerService
          // para mantener compatibilidad con el código existente
          return gmailService as any;
        }
        return new ResendMailerService(config);
      },
      inject: [ConfigService, GmailMailerService],
    },
  ],
  exports: [ResendMailerService],
})
export class MailerModule {}
