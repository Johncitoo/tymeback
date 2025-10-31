import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { ConfigModule } from '@nestjs/config';
import { CommunicationsService } from './communications.service';
import { CommunicationsController } from './communications.controller';
import { EmailTemplate } from './entities/email-template.entity';
import { EmailCampaign } from './entities/email-campaign.entity';
import { CampaignRecipient } from './entities/campaign-recipient.entity';
import { EmailLog } from './entities/email-log.entity';
import { MembershipReminder } from './entities/membership-reminder.entity';
import { MailerModule } from './mailer/mailer.module';
import { User } from '../users/entities/user.entity';
import { Membership } from '../memberships/entities/membership.entity';
import { Plan } from '../plans/entities/plan.entity';

@Module({
  imports: [
    // Si ya usaste ScheduleModule en AppModule, puedes quitar este forRoot()
    ScheduleModule.forRoot(),
    TypeOrmModule.forFeature([
      EmailTemplate,
      EmailCampaign,
      CampaignRecipient,
      EmailLog,
      MembershipReminder,
      User,
      Membership,
      Plan,
    ]),
    ConfigModule,
    MailerModule,
  ],
  controllers: [CommunicationsController],
  providers: [CommunicationsService],
  exports: [TypeOrmModule, CommunicationsService],
})
export class CommunicationsModule {}
