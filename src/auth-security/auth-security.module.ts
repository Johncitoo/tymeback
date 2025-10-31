import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthSecurityService } from './auth-security.service';
import { LoginAttempt } from './entities/login-attempt.entity';

@Module({
  imports: [TypeOrmModule.forFeature([LoginAttempt])],
  providers: [AuthSecurityService],
  exports: [AuthSecurityService],
})
export class AuthSecurityModule {}
