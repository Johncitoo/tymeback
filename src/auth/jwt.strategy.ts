import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { RoleEnum } from '../users/entities/user.entity';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

export type JwtPayload = {
  sub: string;
  gymId: string;
  role: RoleEnum;
  email: string | null;
  fullName: string;
  iat?: number;
  exp?: number;
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      secretOrKey: JWT_SECRET,
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
    });
  }

  async validate(payload: JwtPayload) {
    // Lo que retorne aquí queda en req.user
    return {
      userId: payload.sub,
      gymId: payload.gymId,
      role: payload.role,
      email: payload.email,
      fullName: payload.fullName,
    };
  }
}
