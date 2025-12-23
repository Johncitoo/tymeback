import { Injectable, UnauthorizedException, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { Repository, LessThan, DataSource } from 'typeorm';
import * as crypto from 'crypto';
import { User, RoleEnum } from '../users/entities/user.entity';
import { AuthToken, TokenTypeEnum } from './entities/auth-token.entity';
import { GymUser } from '../gym-users/entities/gym-user.entity';
import { Gym } from '../gyms/entities/gym.entity';
import { CommunicationsService } from '../communications/communications.service';

export interface AuthUser {
  id: string;
  gymId: string;
  role: RoleEnum;
  email: string | null;
  firstName: string;
  lastName: string;
  fullName: string; // computed
}

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private readonly usersRepo: Repository<User>,
    @InjectRepository(GymUser) private readonly gymUsersRepo: Repository<GymUser>,
    @InjectRepository(Gym) private readonly gymsRepo: Repository<Gym>,
    @InjectRepository(AuthToken) private readonly tokensRepo: Repository<AuthToken>,
    private readonly jwtService: JwtService,
    private readonly communicationsService: CommunicationsService,
    private readonly dataSource: DataSource,
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

  private async findByLogin(login: string): Promise<User | null> {
    const normalized = (login || '').trim().toLowerCase();
    // Buscar usuario global por email o RUT (sin gymId)
    let user = await this.usersRepo.findOne({ where: { email: normalized } });
    if (!user) {
      user = await this.usersRepo
        .createQueryBuilder('u')
        .where('LOWER(u.rut) = LOWER(:rut)', { rut: login })
        .getOne();
    }
    return user;
  }

  /**
   * Valida credenciales multi-gym:
   * 1. Resuelve gymSlug → gym
   * 2. Busca usuario global por email/rut
   * 3. Verifica password
   * 4. Valida membership en gym_users
   */
  async validateUser(gymSlug: string, login: string, password: string): Promise<{ user: User; gymUser: GymUser | null; gymId: string }> {
    console.log('🔐 [AUTH] validateUser llamado con:', { gymSlug, login, passwordLength: password?.length });
    
    // 1. Resolver gymSlug → gym
    const gym = await this.gymsRepo.findOne({ where: { slug: gymSlug, isActive: true } });
    if (!gym) {
      console.log('❌ [AUTH] Gimnasio no encontrado:', gymSlug);
      throw new UnauthorizedException('Gimnasio no encontrado o inactivo');
    }
    console.log('✅ [AUTH] Gym encontrado:', { id: gym.id, name: gym.name, slug: gym.slug });

    // 2. Buscar usuario global
    const user = await this.findByLogin(login);
    if (!user || !user.hashedPassword) {
      console.log('❌ [AUTH] Usuario no encontrado:', { userFound: !!user, hasPassword: !!user?.hashedPassword });
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // Verificar si el usuario está activo
    if (!user.isActive) {
      console.log('⚠️ [AUTH] Usuario inactivo (membresía vencida):', { userId: user.id });
      throw new UnauthorizedException(
        'Tu cuenta se encuentra temporalmente inactiva. Tu membresía ha vencido y no se ha registrado un nuevo pago. Por favor, contacta con el gimnasio para renovar tu membresía y reactivar tu acceso.'
      );
    }

    console.log('✅ [AUTH] Usuario encontrado:', { id: user.id, email: user.email, isActive: user.isActive, hasPassword: !!user.hashedPassword });

    // 3. Verificar password
    console.log('🔑 [AUTH] Verificando password...');
    const ok = this.verifyPbkdf2(password, user.hashedPassword);
    console.log('🔑 [AUTH] Resultado verificación:', ok ? '✅ VÁLIDA' : '❌ INVÁLIDA');
    if (!ok) throw new UnauthorizedException('Credenciales inválidas');

    // 4. Verificar membership en gym_users
    let gymUser = await this.gymUsersRepo.findOne({
      where: { gymId: gym.id, userId: user.id, isActive: true },
    });

    // 5. SUPER_ADMIN: Si no tiene gym_users, buscar ANY gym_user con rol SUPER_ADMIN
    if (!gymUser) {
      const superAdminGymUser = await this.gymUsersRepo.findOne({
        where: { userId: user.id, role: RoleEnum.SUPER_ADMIN, isActive: true },
      });
      
      if (superAdminGymUser) {
        // SUPER_ADMIN puede acceder a cualquier gym sin estar explícitamente asociado
        gymUser = superAdminGymUser;
      } else {
        throw new UnauthorizedException('Usuario no tiene acceso a este gimnasio');
      }
    }

    return { user, gymUser, gymId: gym.id };
  }

  /**
   * Obtiene el estado de membresía de un cliente
   * NONE: Sin membresía activa
   * TRIAL: En período de prueba (si implementas)
   * ACTIVE: Membresía activa y vigente
   * EXPIRED: Membresía vencida
   */
  async getMembershipStatus(userId: string, gymId: string): Promise<'NONE' | 'ACTIVE' | 'EXPIRED'> {
    // Solo aplica para clientes
    const gymUser = await this.gymUsersRepo.findOne({
      where: { userId, gymId, role: RoleEnum.CLIENT },
    });

    if (!gymUser) {
      // No es cliente o no pertenece a este gym
      return 'NONE';
    }

    // Consultar v_active_memberships (vista que ya tienes)
    const activeMembership = await this.dataSource.query(
      `SELECT * FROM v_active_memberships WHERE client_gym_user_id = $1 AND gym_id = $2 LIMIT 1`,
      [gymUser.id, gymId]
    );

    if (activeMembership && activeMembership.length > 0) {
      return 'ACTIVE';
    }

    // Verificar si tiene membresías expiradas
    const expiredMembership = await this.dataSource.query(
      `SELECT * FROM memberships m 
       WHERE m.client_gym_user_id = $1 AND m.gym_id = $2 AND m.ends_on < CURRENT_DATE
       LIMIT 1`,
      [gymUser.id, gymId]
    );

    if (expiredMembership && expiredMembership.length > 0) {
      return 'EXPIRED';
    }

    return 'NONE';
  }

  /**
   * Obtiene los datos completos de un cliente para el login
   */
  async getClientFullData(userId: string, gymId: string): Promise<any> {
    try {
      // Obtener gymUser del cliente
      const gymUser = await this.gymUsersRepo.findOne({
        where: { userId, gymId, role: RoleEnum.CLIENT },
      });

      if (!gymUser) {
        return null;
      }

      // Obtener datos del usuario
      const user = await this.usersRepo.findOne({ where: { id: userId } });
      if (!user) {
        return null;
      }

      // Obtener datos del cliente (tabla clients)
      const clientData = await this.dataSource.query(
        `SELECT c.*, p.name as plan_name, p.id as plan_id
         FROM clients c
         LEFT JOIN plans p ON c.plan_id = p.id
         WHERE c.user_id = $1 AND c.gym_id = $2 AND c.deleted_at IS NULL
         LIMIT 1`,
        [userId, gymId]
      );

      if (!clientData || clientData.length === 0) {
        // Si no hay registro en clients, devolver datos básicos
        return {
          id: user.id,
          gymId,
          role: 'CLIENT',
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          fullName: user.fullName,
          phone: user.phone,
          rut: user.rut,
          isActive: user.isActive,
          avatarUrl: user.avatarUrl,
        };
      }

      const client = clientData[0];

      // Construir objeto completo del cliente
      return {
        id: user.id,
        gymId,
        role: 'CLIENT',
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        fullName: user.fullName,
        phone: user.phone,
        rut: user.rut,
        isActive: user.isActive,
        avatarUrl: user.avatarUrl,
        // Datos específicos del cliente
        address: client.address,
        birthDate: client.birth_date,
        gender: client.gender,
        sex: client.sex,
        emergencyContact: client.emergency_contact_name ? {
          name: client.emergency_contact_name,
          phone: client.emergency_contact_phone,
          relationship: client.emergency_contact_relationship,
        } : undefined,
        trainerId: client.trainer_id,
        privateSessions: client.private_sessions || 0,
        membershipExpiry: client.membership_expiry,
        plan: client.plan_id ? {
          id: client.plan_id,
          name: client.plan_name,
        } : undefined,
        planId: client.plan_id,
      };
    } catch (error) {
      console.error('Error obteniendo datos completos del cliente:', error);
      return null;
    }
  }

  signToken(user: User, gymId: string, role: RoleEnum) {
    const payload = {
      sub: user.id,
      gymId: gymId, // Del gym_user
      role: role,   // Del gym_user (puede ser diferente por gym)
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      fullName: user.fullName, // computed
    };
    return this.jwtService.sign(payload);
  }

  toAuthUser(user: User, gymId: string, role: RoleEnum): AuthUser {
    return {
      id: user.id,
      gymId: gymId,
      role: role,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      fullName: user.fullName,
    };
  }

  async getProfile(userId: string): Promise<User> {
    const user = await this.usersRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('Usuario no encontrado');
    return user;
  }

  async updateProfile(userId: string, dto: any): Promise<User> {
    const user = await this.usersRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('Usuario no encontrado');

    // fullName ya es computed en BD, no necesitamos actualizarlo manualmente

    if (dto.firstName !== undefined) user.firstName = dto.firstName;
    if (dto.lastName !== undefined) user.lastName = dto.lastName;
    if (dto.email !== undefined) user.email = dto.email;
    if (dto.phone !== undefined) user.phone = dto.phone;

    return this.usersRepo.save(user);
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    const user = await this.usersRepo.findOne({ where: { id: userId } });
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
   * Envía correo de recuperación de contraseña
   */
  async forgotPassword(email: string): Promise<void> {
    const user = await this.usersRepo.findOne({ where: { email: email.toLowerCase().trim() } });
    
    // Por seguridad, no revelamos si el email existe
    if (!user) {
      console.log(`Forgot password request for non-existent email: ${email}`);
      return;
    }

    // Generar token de recuperación
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1); // 1 hora de validez

    // Guardar token
    const authToken = this.tokensRepo.create({
      userId: user.id,
      token,
      type: TokenTypeEnum.PASSWORD_RESET,
      expiresAt,
      isUsed: false,
    });
    await this.tokensRepo.save(authToken);

    // Obtener el gymId del usuario (primer gym al que pertenece)
    const gymUser = await this.gymUsersRepo.findOne({
      where: { userId: user.id },
    });

    if (!gymUser) {
      console.log(`User ${user.id} has no gym membership, skipping email`);
      return;
    }

    // Enviar correo de recuperación
    try {
      await this.communicationsService.sendPasswordResetEmail(
        gymUser.gymId,
        user.id,
        user.email!,
        user.fullName,
        token
      );
      console.log(`✅ Password reset email sent to ${user.email}`);
    } catch (error) {
      console.error(`❌ Error sending password reset email:`, error);
      throw error;
    }
  }

  /**
   * Restablece la contraseña con un token válido
   */
  async resetPassword(token: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    const authToken = await this.tokensRepo.findOne({
      where: { token, type: TokenTypeEnum.PASSWORD_RESET },
    });

    if (!authToken) {
      return { success: false, message: 'Token inválido' };
    }

    if (authToken.isUsed) {
      return { success: false, message: 'Este enlace ya fue utilizado' };
    }

    if (new Date() > authToken.expiresAt) {
      return { success: false, message: 'Este enlace ha expirado' };
    }

    // Actualizar contraseña
    const hashedPassword = this.hashPassword(newPassword);
    await this.usersRepo.update(
      { id: authToken.userId },
      { hashedPassword }
    );

    // Marcar token como usado
    authToken.isUsed = true;
    authToken.usedAt = new Date();
    await this.tokensRepo.save(authToken);

    console.log(`✅ Password reset successful for user ${authToken.userId}`);
    return { success: true, message: 'Contraseña actualizada exitosamente' };
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
