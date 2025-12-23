import { Module, forwardRef } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthService } from './auth.service';
import { JwtStrategy } from './jwt.strategy';
import { AuthController } from './auth.controller';
import { User } from '../users/entities/user.entity';
import { AuthToken } from './entities/auth-token.entity';
import { GymUser } from '../gym-users/entities/gym-user.entity';
import { Gym } from '../gyms/entities/gym.entity';
import { CommunicationsModule } from '../communications/communications.module';
import { ClientsModule } from '../clients/clients.module';

// Tipos de 'ms' que usa jsonwebtoken para expiresIn
import type { StringValue as MsStringValue } from 'ms';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';
const JWT_EXPIRES = (process.env.JWT_EXPIRES || '7d') as any; // evita el error de tipos

function getExpires(): number | MsStringValue {
  const raw = process.env.JWT_EXPIRES?.trim();
  // Sin env => por defecto 7 días
  if (!raw) return '7d' as MsStringValue;

  // Si viene numérico, lo tratamos como segundos
  const n = Number(raw);
  if (!Number.isNaN(n)) return n;

  // Si viene formato ms ("7d", "12h", "30m"), lo casteamos al tipo
  return raw as MsStringValue;
}

@Module({
  imports: [
    TypeOrmModule.forFeature([User, AuthToken, GymUser, Gym]),
    PassportModule.register({ defaultStrategy: 'jwt' }), // 👈 recomendado
    JwtModule.register({
      secret: JWT_SECRET,
      signOptions: { expiresIn: JWT_EXPIRES },
    }),
    CommunicationsModule,
    forwardRef(() => ClientsModule),
  ],
  providers: [AuthService, JwtStrategy],
  controllers: [AuthController],
  exports: [PassportModule, JwtModule, AuthService],
})
export class AuthModule {}