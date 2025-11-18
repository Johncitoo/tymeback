import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GmailMailerService } from './gmail-mailer.service';
import { MailerService } from './mailer.service';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true })],
  providers: [
    GmailMailerService,
    MailerService,
  ],
  exports: [MailerService],
})
export class MailerModule {}
