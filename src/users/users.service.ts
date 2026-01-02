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
        // Usuario existe, verificar si ya tiene este rol específico en este gym
        const gymUser = await this.gymUsersRepo.findOne({
          where: { userId: existing.id, gymId, role: dto.role },
        });
        if (gymUser) {
          throw new ConflictException(`Este usuario ya tiene el rol ${dto.role} en este gimnasio`);
        }
        
        // Usuario existe pero no tiene este rol → actualizar datos y agregar rol
        // Smart Merge: actualizar solo campos que vienen y (están NULL O son diferentes)
        const updates: any = {};
        
        // Nombre siempre se puede actualizar (mejora continua)
        if (dto.firstName && dto.firstName !== existing.firstName) updates.firstName = dto.firstName;
        if (dto.lastName && dto.lastName !== existing.lastName) updates.lastName = dto.lastName;
        
        // Datos personales: actualizar solo si están vacíos o son diferentes
        if (dto.phone && (!existing.phone || existing.phone !== dto.phone)) {
          updates.phone = dto.phone;
        }
        if (dto.rut && (!existing.rut || existing.rut !== dto.rut)) {
          updates.rut = dto.rut;
        }
        if (dto.birthDate && (!existing.birthDate || new Date(existing.birthDate).toISOString() !== new Date(dto.birthDate).toISOString())) {
          updates.birthDate = new Date(dto.birthDate);
        }
        if (dto.gender && (!existing.gender || existing.gender !== dto.gender)) {
          updates.gender = dto.gender;
        }
        if (dto.address && (!existing.address || existing.address !== dto.address)) {
          updates.address = dto.address;
        }
        
        // Avatar: actualizar solo si viene nuevo
        if (dto.avatarUrl && dto.avatarUrl !== existing.avatarUrl) {
          updates.avatarUrl = dto.avatarUrl;
        }
        
        // Aplicar cambios si hay
        if (Object.keys(updates).length > 0) {
          await this.repo.update(existing.id, updates);
          console.log('✅ Usuario actualizado con:', Object.keys(updates));
        }
        
        // Usuario existe pero no tiene este rol → crear gym_user con nuevo rol
        const newGymUser = this.gymUsersRepo.create({
          gymId,
          userId: existing.id,
          role: dto.role,
          isActive: dto.isActive ?? true,
        });
        await this.gymUsersRepo.save(newGymUser);
        console.log('✅ Membership creado para usuario existente:', existing.id);

        // Crear registro específico según el rol
        if (dto.role === RoleEnum.CLIENT) {
          await this.repo.query(
            `INSERT INTO clients (gym_user_id) VALUES ($1) ON CONFLICT DO NOTHING`,
            [newGymUser.id]
          );
          console.log('✅ Client record created for existing user');
        } else if (dto.role === RoleEnum.TRAINER) {
          await this.repo.query(
            `INSERT INTO trainers (gym_user_id, specialties) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
            [newGymUser.id, dto.specialties || []]
          );
          console.log('✅ Trainer record created for existing user');
        } else if (dto.role === RoleEnum.NUTRITIONIST) {
          await this.repo.query(
            `INSERT INTO nutritionists (gym_user_id) VALUES ($1) ON CONFLICT DO NOTHING`,
            [newGymUser.id]
          );
          console.log('✅ Nutritionist record created for existing user');
        }

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

      // Actualizar uploaded_by_user_id del avatar si existe
      if (dto.avatarUrl) {
        console.log('🟣 Updating avatar file ownership...');
        const match = dto.avatarUrl.match(/\/([^\/\?]+)(\?|$)/);
        if (match) {
          const storageKey = decodeURIComponent(match[1]);
          await this.repo.query(
            `UPDATE files SET uploaded_by_user_id = $1 WHERE gym_id = $2 AND storage_key LIKE $3 AND purpose = 'AVATAR' AND uploaded_by_user_id IS NULL`,
            [saved.id, gymId, `%${storageKey}%`]
          );
          console.log('🟣 Avatar file ownership updated');
        }
      }

      // Crear gym_user (membership)
      const gymUser = this.gymUsersRepo.create({
        gymId,
        userId: saved.id,
        role: dto.role,
        isActive: dto.isActive ?? true,
      });
      await this.gymUsersRepo.save(gymUser);
      console.log('🟣 Gym user membership created:', gymUser.id);

      // Crear registro específico según el rol
      if (dto.role === RoleEnum.CLIENT) {
        await this.repo.query(
          `INSERT INTO clients (gym_user_id) VALUES ($1) ON CONFLICT DO NOTHING`,
          [gymUser.id]
        );
        console.log('🟣 Client record created');
      } else if (dto.role === RoleEnum.TRAINER) {
        await this.repo.query(
          `INSERT INTO trainers (gym_user_id, specialties) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
          [gymUser.id, dto.specialties || []]
        );
        console.log('🟣 Trainer record created');
      } else if (dto.role === RoleEnum.NUTRITIONIST) {
        await this.repo.query(
          `INSERT INTO nutritionists (gym_user_id) VALUES ($1) ON CONFLICT DO NOTHING`,
          [gymUser.id]
        );
        console.log('🟣 Nutritionist record created');
      }

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
    try {
      // Usar query manual con el QueryRunner para evitar problemas de TypeORM metadata
      const queryRunner = this.repo.manager.connection.createQueryRunner();
      
      // Construir query base
      let sql = `
        SELECT 
          u.id, u.email, u.first_name as "firstName", u.last_name as "lastName", 
          u.full_name as "fullName", u.phone, u.rut, u.birth_date as "birthDate",
          u.gender, u.sex, u.address, u.avatar_url as "avatarUrl",
          (
            SELECT f.id FROM files f 
            WHERE f.owner_gym_user_id = gu.id
            AND f.gym_id = gu.gym_id 
            AND f.purpose = 'AVATAR'
            AND f.status = 'READY'
            ORDER BY f.created_at DESC
            LIMIT 1
          ) as "avatarFileId",
          u.platform_role as "platformRole", u.is_active as "isActive",
          u.created_at as "createdAt", u.updated_at as "updatedAt",
          gu.role as "role",
          t.specialties as "specialties",
          t.certifications as "certifications",
          n.specialties as "nutritionistSpecialties",
          n.certifications as "nutritionistCertifications",
          COUNT(*) OVER() as total
        FROM users u
        INNER JOIN gym_users gu ON gu.user_id = u.id
        LEFT JOIN trainers t ON t.gym_user_id = gu.id
        LEFT JOIN nutritionists n ON n.gym_user_id = gu.id
        WHERE gu.gym_id = $1
      `;
      
      const params: any[] = [q.gymId];
      let paramIndex = 2;
      
      if (q.role) {
        sql += ` AND gu.role = $${paramIndex}`;
        params.push(q.role);
        paramIndex++;
      }
      
      if (typeof q.isActive === 'boolean') {
        sql += ` AND gu.is_active = $${paramIndex}`;
        params.push(q.isActive);
        paramIndex++;
      }
      
      if (q.q) {
        const like = `%${q.q}%`;
        sql += ` AND (u.full_name ILIKE $${paramIndex} OR u.email ILIKE $${paramIndex} OR u.rut ILIKE $${paramIndex} OR u.phone ILIKE $${paramIndex})`;
        params.push(like);
        paramIndex++;
      }
      
      sql += ` ORDER BY u.created_at DESC`;
      sql += ` LIMIT ${q.limit} OFFSET ${q.offset}`;
      
      console.log('Manual SQL:', sql);
      console.log('Params:', params);
      
      const result = await queryRunner.query(sql, params);
      await queryRunner.release();
      
      const total = result.length > 0 ? parseInt(result[0].total, 10) : 0;
      const data = result.map(row => {
        delete row.total;
        return row;
      });
      
      return { data, total };
    } catch (error) {
      console.error('Error en findAll:', error);
      throw error;
    }
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
