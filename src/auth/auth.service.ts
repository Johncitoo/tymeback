import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import * as crypto from 'crypto';
import { User, RoleEnum } from '../users/entities/user.entity';

export interface AuthUser {
  userId: string;
  gymId: string;
  role: RoleEnum;
  email: string | null;
  fullName: string;
}

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private readonly usersRepo: Repository<User>,
    private readonly jwtService: JwtService,
  ) {}

  private verifyPbkdf2(plain: string, stored: string): boolean {
    // formato: pbkdf2$100000$<salt>$<hash>
    const m = stored.match(/^pbkdf2\$(\d+)\$([a-f0-9]+)\$([a-f0-9]+)$/i);
    if (!m) return false;
    const iterations = parseInt(m[1], 10);
    const salt = m[2];
    const hash = m[3];
    const calc = crypto
      .pbkdf2Sync(plain, salt, iterations, hash.length / 2, 'sha512')
      .toString('hex');
    // timing-safe compare
    return crypto.timingSafeEqual(Buffer.from(calc, 'hex'), Buffer.from(hash, 'hex'));
  }

  private async findByLogin(gymId: string, login: string) {
    const normalized = (login || '').trim().toLowerCase();
    // intentar por email primero; si no, por RUT (case-insensitive)
    let user = await this.usersRepo.findOne({ where: { gymId, email: normalized } });
    if (!user) {
      user = await this.usersRepo
        .createQueryBuilder('u')
        .where('u.gym_id = :gymId', { gymId })
        .andWhere('LOWER(u.rut) = LOWER(:rut)', { rut: login })
        .getOne();
    }
    return user;
  }

  async validateUser(gymId: string, login: string, password: string): Promise<User> {
    const user = await this.findByLogin(gymId, login);
    if (!user || !user.isActive || !user.hashedPassword) {
      throw new UnauthorizedException('Credenciales inválidas');
    }
    const ok = this.verifyPbkdf2(password, user.hashedPassword);
    if (!ok) throw new UnauthorizedException('Credenciales inválidas');
    return user;
  }

  signToken(user: User) {
    const payload = {
      sub: user.id,
      gymId: user.gymId,
      role: user.role,
      email: user.email,
      fullName: user.fullName,
    };
    return this.jwtService.sign(payload);
  }

  toAuthUser(user: User): AuthUser {
    return {
      userId: user.id,
      gymId: user.gymId,
      role: user.role,
      email: user.email,
      fullName: user.fullName,
    };
  }
}
