import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SessionBurnsService } from './session-burns.service';
import { SessionBurnsController } from './session-burns.controller';
import { SessionBurn } from './entities/session-burn.entity';
import { SessionQrToken } from './entities/session-qr-token.entity';
import { User } from '../users/entities/user.entity';
import { Membership } from '../memberships/entities/membership.entity';
import { MembershipsModule } from '../memberships/memberships.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([SessionBurn, SessionQrToken, User, Membership]),
    MembershipsModule,
  ],
  controllers: [SessionBurnsController],
  providers: [SessionBurnsService],
  exports: [SessionBurnsService],
})
export class SessionBurnsModule {}
