import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BrevoMailerService } from './brevo-mailer.service';
import { MailerService } from './mailer.service';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true })],
  providers: [
    BrevoMailerService,
    MailerService,
  ],
  exports: [MailerService],
})
export class MailerModule {}
