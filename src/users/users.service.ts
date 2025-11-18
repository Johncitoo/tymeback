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

  async create(dto: CreateUserDto): Promise<User> {
    console.log('🟣 UsersService.create - START');
    console.log('🟣 DTO:', dto);
    
    const entity = this.repo.create({
      gymId: dto.gymId,
      role: dto.role,
      fullName: dto.fullName,
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

      // Si es CLIENT y tiene email, enviar email de activación
      if (saved.role === RoleEnum.CLIENT && saved.email) {
        console.log('🟣 User is CLIENT with email, sending activation email...');
        try {
          console.log('🟣 Creating activation token...');
          // Generar token de activación (válido 72 horas)
          const activationToken = await this.authService.createActivationToken(saved.id, 72);
          console.log('🟣 Activation token created:', activationToken);
          
          console.log('🟣 Calling sendAccountActivationEmail...');
          // Enviar email de activación
          await this.commsService.sendAccountActivationEmail(
            saved.gymId,
            saved.id,
            saved.email,
            saved.fullName,
            activationToken
          );
          console.log('✅ Activation email sent successfully');
        } catch (emailErr) {
          // No fallar el registro si el email falla
          console.error('⚠️ Error sending activation email (not failing registration):', emailErr);
        }
      }

      console.log('✅ UsersService.create completed');
      return saved;
    } catch (err: any) {
      console.error('❌ Error in UsersService.create:', err);
      if (err?.code === '23505') {
        // Unique: email por gym (no null) o rut por gym
        if (String(err?.detail || '').includes('(gym_id, email)')) {
          throw new ConflictException('Ya existe un usuario con ese email en este gimnasio');
        }
        if (String(err?.detail || '').includes('(gym_id, rut)')) {
          throw new ConflictException('Ya existe un usuario con ese RUT en este gimnasio');
        }
        throw new ConflictException('Registro duplicado');
      }
      throw err;
    }
  }

  async findAll(q: QueryUsersDto): Promise<{ data: User[]; total: number }> {
    const where: any = { gymId: q.gymId };

    if (q.role) where.role = q.role;
    if (typeof q.isActive === 'boolean') where.isActive = q.isActive;

    const qb = this.repo.createQueryBuilder('u').where(where);

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
    const user = await this.repo.findOne({ where: { id, gymId } });
    if (!user) throw new NotFoundException('Usuario no encontrado');
    return user;
  }

  async update(id: string, gymId: string, dto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id, gymId);

    if (dto.fullName !== undefined) user.fullName = dto.fullName;
    if (dto.role !== undefined) user.role = dto.role;
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

    try {
      return await this.repo.save(user);
    } catch (err: any) {
      if (err?.code === '23505') {
        if (String(err?.detail || '').includes('(gym_id, email)')) {
          throw new ConflictException('Ya existe un usuario con ese email en este gimnasio');
        }
        if (String(err?.detail || '').includes('(gym_id, rut)')) {
          throw new ConflictException('Ya existe un usuario con ese RUT en este gimnasio');
        }
        throw new ConflictException('Registro duplicado');
      }
      throw err;
    }
  }

  async remove(id: string, gymId: string): Promise<{ id: string }> {
    const res = await this.repo.softDelete({ id, gymId });
    if (!res.affected) throw new NotFoundException('Usuario no encontrado');
    return { id };
  }

  async updateAvatar(id: string, gymId: string, avatarUrl: string): Promise<User> {
    const user = await this.findOne(id, gymId);
    user.avatarUrl = avatarUrl;
    return await this.repo.save(user);
  }
}
