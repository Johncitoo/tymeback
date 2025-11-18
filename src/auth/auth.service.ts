import { Injectable, UnauthorizedException, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { Repository, LessThan } from 'typeorm';
import * as crypto from 'crypto';
import { User, RoleEnum } from '../users/entities/user.entity';
import { AuthToken, TokenTypeEnum } from './entities/auth-token.entity';
import { CommunicationsService } from '../communications/communications.service';

export interface AuthUser {
  id: string;
  gymId: string;
  role: RoleEnum;
  email: string | null;
  fullName: string;
}

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private readonly usersRepo: Repository<User>,
    @InjectRepository(AuthToken) private readonly tokensRepo: Repository<AuthToken>,
    private readonly jwtService: JwtService,
    private readonly communicationsService: CommunicationsService,
  ) {}

  private hashPassword(plain: string): string {
    const iterations = 100000;
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto
      .pbkdf2Sync(plain, salt, iterations, 64, 'sha512')
      .toString('hex');
    return `pbkdf2$${iterations}$${salt}$${hash}`;
  }

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
      id: user.id,
      gymId: user.gymId,
      role: user.role,
      email: user.email,
      fullName: user.fullName,
    };
  }

  async getProfile(userId: string, gymId: string): Promise<User> {
    const user = await this.usersRepo.findOne({ where: { id: userId, gymId } });
    if (!user) throw new NotFoundException('Usuario no encontrado');
    return user;
  }

  async updateProfile(userId: string, gymId: string, dto: any): Promise<User> {
    const user = await this.usersRepo.findOne({ where: { id: userId, gymId } });
    if (!user) throw new NotFoundException('Usuario no encontrado');

    // Actualizar fullName si se proporciona firstName o lastName
    if (dto.firstName !== undefined || dto.lastName !== undefined) {
      const firstName = dto.firstName !== undefined ? dto.firstName : '';
      const lastName = dto.lastName !== undefined ? dto.lastName : '';
      user.fullName = `${firstName} ${lastName}`.trim();
    }

    if (dto.email !== undefined) user.email = dto.email;
    if (dto.phone !== undefined) user.phone = dto.phone;

    return this.usersRepo.save(user);
  }

  async changePassword(userId: string, gymId: string, currentPassword: string, newPassword: string): Promise<void> {
    const user = await this.usersRepo.findOne({ where: { id: userId, gymId } });
    if (!user) throw new NotFoundException('Usuario no encontrado');

    // Verificar contraseña actual
    if (!user.hashedPassword) {
      throw new BadRequestException('El usuario no tiene contraseña configurada');
    }

    const isValid = this.verifyPbkdf2(currentPassword, user.hashedPassword);
    if (!isValid) {
      throw new UnauthorizedException('Contraseña actual incorrecta');
    }

    // Validar nueva contraseña
    if (!newPassword || newPassword.length < 8) {
      throw new BadRequestException('La nueva contraseña debe tener al menos 8 caracteres');
    }

    // Hashear y guardar nueva contraseña
    user.hashedPassword = this.hashPassword(newPassword);
    await this.usersRepo.save(user);
  }

  /**
   * Genera un token único de activación de cuenta
   * @param userId ID del usuario
   * @param expiresInHours Horas de validez del token (default: 72h = 3 días)
   */
  async createActivationToken(userId: string, expiresInHours = 72): Promise<string> {
    // Generar token seguro (32 bytes = 64 caracteres hex)
    const token = crypto.randomBytes(32).toString('hex');
    
    // Calcular fecha de expiración
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + expiresInHours);

    // Guardar en base de datos
    const authToken = this.tokensRepo.create({
      userId,
      token,
      type: TokenTypeEnum.ACCOUNT_ACTIVATION,
      expiresAt,
      isUsed: false,
      usedAt: null,
    });

    await this.tokensRepo.save(authToken);
    return token;
  }

  /**
   * Verifica si un token de activación es válido
   */
  async verifyActivationToken(token: string): Promise<{ valid: boolean; userId?: string; email?: string; fullName?: string }> {
    const authToken = await this.tokensRepo.findOne({
      where: { token, type: TokenTypeEnum.ACCOUNT_ACTIVATION },
      relations: ['user'],
    });

    if (!authToken) {
      return { valid: false };
    }

    // Verificar si ya fue usado
    if (authToken.isUsed) {
      return { valid: false };
    }

    // Verificar si expiró
    if (new Date() > authToken.expiresAt) {
      return { valid: false };
    }

    return {
      valid: true,
      userId: authToken.userId,
      email: authToken.user?.email || undefined,
      fullName: authToken.user?.fullName || undefined,
    };
  }

  /**
   * Activa una cuenta estableciendo una nueva contraseña
   */
  async activateAccount(token: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    // Verificar token
    const verification = await this.verifyActivationToken(token);
    if (!verification.valid || !verification.userId) {
      throw new BadRequestException('Token inválido o expirado');
    }

    // Validar contraseña
    if (!newPassword || newPassword.length < 8) {
      throw new BadRequestException('La contraseña debe tener al menos 8 caracteres');
    }

    // Obtener usuario
    const user = await this.usersRepo.findOne({ where: { id: verification.userId } });
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    // Establecer contraseña
    user.hashedPassword = this.hashPassword(newPassword);
    user.isActive = true; // Asegurar que la cuenta esté activa
    await this.usersRepo.save(user);

    // Marcar token como usado
    const authToken = await this.tokensRepo.findOne({ where: { token } });
    if (authToken) {
      authToken.isUsed = true;
      authToken.usedAt = new Date();
      await this.tokensRepo.save(authToken);
    }

    return {
      success: true,
      message: 'Cuenta activada exitosamente',
    };
  }

  /**
   * Limpia tokens expirados (se puede ejecutar con un cron job)
   */
  async cleanExpiredTokens(): Promise<number> {
    const result = await this.tokensRepo.delete({
      expiresAt: LessThan(new Date()),
    });
    return result.affected || 0;
  }
}
