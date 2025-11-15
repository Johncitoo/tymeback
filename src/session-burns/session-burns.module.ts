import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
// import { SessionBurnsService } from './session-burns.service'; // DESHABILITADO
// import { SessionBurnsController } from './session-burns.controller'; // DESHABILITADO
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
  controllers: [], // SessionBurnsController - COMENTADO hasta arreglar MembershipsService dependencies
  providers: [], // SessionBurnsService - COMENTADO hasta arreglar gymId en Membership
  exports: [TypeOrmModule], // Removido SessionBurnsService del export
})
export class SessionBurnsModule {}
