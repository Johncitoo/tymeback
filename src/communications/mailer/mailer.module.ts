import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SesMailerService } from './ses-mailer.service';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true })],
  providers: [SesMailerService],
  exports: [SesMailerService],
})
export class MailerModule {}
