// src/users/users.service.ts
import {
  ConflictException,
  Injectable,
  NotFoundException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { User, RoleEnum } from './entities/user.entity';
import { GymUser } from '../gym-users/entities/gym-user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { QueryUsersDto } from './dto/query-users.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { CommunicationsService } from '../communications/communications.service';
import { AuthService } from '../auth/auth.service';
import * as crypto from 'crypto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly repo: Repository<User>,
    @InjectRepository(GymUser)
    private readonly gymUsersRepo: Repository<GymUser>,
    private readonly commsService: CommunicationsService,
    @Inject(forwardRef(() => AuthService))
    private readonly authService: AuthService,
  ) {}

  private hashPassword(plain: string): string {
    // Placeholder mínimo (migrar a Argon2 en módulo Auth)
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(plain, salt, 100000, 64, 'sha512').toString('hex');
    return `pbkdf2$100000$${salt}$${hash}`;
  }

  async create(dto: CreateUserDto, gymId: string): Promise<User> {
    console.log('🟣 UsersService.create - START');
    console.log('🟣 DTO:', dto, 'gymId:', gymId);
    
    // Verificar si el email ya existe globalmente (users es global)
    if (dto.email) {
      const existing = await this.repo.findOne({ where: { email: dto.email } });
      if (existing) {
        // Usuario existe, verificar si ya tiene membership en este gym
        const gymUser = await this.gymUsersRepo.findOne({
          where: { userId: existing.id, gymId },
        });
        if (gymUser) {
          throw new ConflictException('Este usuario ya existe en este gimnasio');
        }
        // Usuario existe pero no en este gym → crear solo gym_user
        const newGymUser = this.gymUsersRepo.create({
          gymId,
          userId: existing.id,
          role: dto.role,
          isActive: dto.isActive ?? true,
        });
        await this.gymUsersRepo.save(newGymUser);
        console.log('✅ Membership creado para usuario existente:', existing.id);
        return existing;
      }
    }

    // Usuario nuevo → crear user + gym_user
    const entity = this.repo.create({
      // NOTA: role NO va en users (está en gym_users)
      firstName: dto.firstName,
      lastName: dto.lastName,
      email: dto.email ?? null,
      hashedPassword: dto.password ? this.hashPassword(dto.password) : null,
      phone: dto.phone ?? null,
      rut: dto.rut ?? null,
      birthDate: dto.birthDate ? new Date(dto.birthDate) : null,
      gender: dto.gender ?? null,
      sex: dto.sex ?? null,
      address: dto.address ?? null,
      avatarUrl: dto.avatarUrl ?? null,
      isActive: dto.isActive ?? true,
    });

    try {
      console.log('🟣 Saving user to database...');
      const saved = await this.repo.save(entity);
      console.log('🟣 User saved:', saved.id);

      // Crear gym_user (membership)
      const gymUser = this.gymUsersRepo.create({
        gymId,
        userId: saved.id,
        role: dto.role,
        isActive: dto.isActive ?? true,
      });
      await this.gymUsersRepo.save(gymUser);
      console.log('🟣 Gym user membership created:', gymUser.id);

      // Si es CLIENT y tiene email, enviar email de activación
      if (dto.role === RoleEnum.CLIENT && saved.email) {
        console.log('🟣 User is CLIENT with email, sending activation email...');
        try {
          console.log('🟣 Creating activation token...');
          const activationToken = await this.authService.createActivationToken(saved.id, 72);
          console.log('🟣 Activation token created:', activationToken);
          
          console.log('🟣 Calling sendAccountActivationEmail...');
          await this.commsService.sendAccountActivationEmail(
            gymId,
            saved.id,
            saved.email,
            saved.fullName,
            activationToken
          );
          console.log('✅ Activation email sent successfully');
        } catch (emailErr) {
          console.error('⚠️ Error sending activation email (not failing registration):', emailErr);
        }
      }

      console.log('✅ UsersService.create completed');
      return saved;
    } catch (err: any) {
      console.error('❌ Error in UsersService.create:', err);
      if (err?.code === '23505') {
        if (String(err?.detail || '').includes('email')) {
          throw new ConflictException('Ya existe un usuario con ese email');
        }
        throw new ConflictException('Registro duplicado');
      }
      throw err;
    }
  }

  async findAll(q: QueryUsersDto): Promise<{ data: User[]; total: number }> {
    // JOIN con gym_users para obtener solo usuarios del gym
    const qb = this.repo
      .createQueryBuilder('u')
      .select([
        'u.id', 'u.email', 'u.firstName', 'u.lastName', 'u.fullName',
        'u.phone', 'u.rut', 'u.birthDate', 'u.gender', 'u.sex',
        'u.address', 'u.avatarUrl', 'u.platformRole', 'u.isActive',
        'u.createdAt', 'u.updatedAt'
      ])
      .innerJoin('gym_users', 'gu', 'gu.user_id = u.id')
      .where('gu.gym_id = :gymId', { gymId: q.gymId });

    if (q.role) qb.andWhere('gu.role = :role', { role: q.role });
    if (typeof q.isActive === 'boolean') qb.andWhere('gu.is_active = :isActive', { isActive: q.isActive });

    if (q.q) {
      const like = `%${q.q}%`;
      qb.andWhere(
        '(u.full_name ILIKE :like OR u.email ILIKE :like OR u.rut ILIKE :like OR u.phone ILIKE :like)',
        { like },
      );
    }

    qb.orderBy('u.created_at', 'DESC').skip(q.offset).take(q.limit);

    const [data, total] = await qb.getManyAndCount();
    return { data, total };
  }

  async findOne(id: string, gymId: string): Promise<User> {
    // Verificar que el usuario tenga membership en este gym
    const gymUser = await this.gymUsersRepo.findOne({
      where: { userId: id, gymId },
    });
    if (!gymUser) throw new NotFoundException('Usuario no encontrado en este gimnasio');

    const user = await this.repo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('Usuario no encontrado');
    return user;
  }

  async update(id: string, gymId: string, dto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id, gymId);

    // Actualizar datos del user (global)
    if (dto.firstName !== undefined) user.firstName = dto.firstName;
    if (dto.lastName !== undefined) user.lastName = dto.lastName;
    if (dto.email !== undefined) user.email = dto.email;
    if (dto.password !== undefined) {
      user.hashedPassword = dto.password ? this.hashPassword(dto.password) : null;
    }
    if (dto.phone !== undefined) user.phone = dto.phone;
    if (dto.rut !== undefined) user.rut = dto.rut;
    if (dto.birthDate !== undefined) user.birthDate = dto.birthDate ? new Date(dto.birthDate) : null;
    if (dto.gender !== undefined) user.gender = dto.gender;
    if (dto.sex !== undefined) user.sex = dto.sex;
    if (dto.address !== undefined) user.address = dto.address;
    if (dto.avatarUrl !== undefined) user.avatarUrl = dto.avatarUrl;
    if (dto.isActive !== undefined) user.isActive = dto.isActive;

    // Actualizar role y isActive en gym_users (específico del gym)
    if (dto.role !== undefined || dto.isActive !== undefined) {
      const gymUser = await this.gymUsersRepo.findOne({
        where: { userId: id, gymId },
      });
      if (gymUser) {
        if (dto.role !== undefined) gymUser.role = dto.role;
        if (dto.isActive !== undefined) gymUser.isActive = dto.isActive;
        await this.gymUsersRepo.save(gymUser);
      }
    }

    try {
      return await this.repo.save(user);
    } catch (err: any) {
      if (err?.code === '23505') {
        if (String(err?.detail || '').includes('email')) {
          throw new ConflictException('Ya existe un usuario con ese email');
        }
        throw new ConflictException('Registro duplicado');
      }
      throw err;
    }
  }

  async remove(id: string, gymId: string): Promise<{ id: string }> {
    // Eliminar solo gym_user (membership en este gym)
    // El user global se mantiene (puede tener memberships en otros gyms)
    const gymUser = await this.gymUsersRepo.findOne({
      where: { userId: id, gymId },
    });
    if (!gymUser) throw new NotFoundException('Usuario no encontrado en este gimnasio');

    await this.gymUsersRepo.delete(gymUser.id);
    
    // OPCIONAL: Si el user no tiene más memberships, eliminar user también
    const otherMemberships = await this.gymUsersRepo.count({ where: { userId: id } });
    if (otherMemberships === 0) {
      await this.repo.delete(id);
    }

    return { id };
  }

  async updateAvatar(id: string, gymId: string, avatarUrl: string): Promise<User> {
    const user = await this.findOne(id, gymId);
    user.avatarUrl = avatarUrl;
    return await this.repo.save(user);
  }
}
