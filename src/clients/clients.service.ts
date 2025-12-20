// src/clients/clients.service.ts
import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, ILike, IsNull, Repository } from 'typeorm';
import { Client } from './entities/client.entity';
import { EmergencyContact } from './entities/emergency-contact.entity';
import { GymUser } from '../gym-users/entities/gym-user.entity';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { QueryClientsDto } from './dto/query-clients.dto';
import { UsersService } from '../users/users.service';
import { RoleEnum, User } from '../users/entities/user.entity';

@Injectable()
export class ClientsService {
  constructor(
    @InjectRepository(Client)
    private readonly clientsRepo: Repository<Client>,
    @InjectRepository(EmergencyContact)
    private readonly contactsRepo: Repository<EmergencyContact>,
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
    @InjectRepository(GymUser)
    private readonly gymUsersRepo: Repository<GymUser>,
    private readonly usersService: UsersService,
    private readonly dataSource: DataSource,
  ) {}

  async create(dto: CreateClientDto, gymId: string) {
    console.log('🔵 ClientsService.create - START');
    console.log('🔵 DTO:', dto, 'gymId:', gymId);
    
    // Helper: Obtener gym_user_id de un usuario (trainer/nutritionist)
    const getGymUserId = async (userId: string, role?: RoleEnum): Promise<string> => {
      const user = await this.usersService.findOne(userId, gymId);
      if (!user) throw new NotFoundException(`Usuario staff no encontrado (${userId})`);
      
      // Obtener gym_user_id
      const gymUser = await this.gymUsersRepo.findOne({
        where: { userId: user.id, gymId },
      });
      if (!gymUser) throw new NotFoundException(`Usuario no pertenece a este gimnasio`);
      
      // Validar rol si se especifica
      if (role && gymUser.role !== role) {
        throw new ConflictException(`El usuario ${userId} no es ${role}`);
      }
      
      return gymUser.id;
    };

    console.log('🔵 Starting transaction...');
    try {
      const result = await this.dataSource.transaction(async (trx) => {
        console.log('🔵 Inside transaction - creating user...');
        
        // 1) Crear usuario con rol CLIENT (crea user + gym_user)
        const user = await this.usersService.create({
          role: RoleEnum.CLIENT,
          firstName: dto.firstName,
          lastName: dto.lastName,
          email: dto.email ?? '',
          password: 'temporal123',
          phone: dto.phone,
          rut: dto.rut,
          birthDate: dto.birthDate,
          gender: dto.gender as any,
          sex: dto.biologicalSex as any,
          address: dto.address,
          avatarUrl: dto.avatarUrl,
          isActive: true,
        }, gymId);

        console.log('🔵 User created:', user.id);

        // 2) Obtener gym_user_id del cliente recién creado
        const gymUser = await trx.getRepository(GymUser).findOne({
          where: { userId: user.id, gymId },
        });
        if (!gymUser) throw new Error('gym_user no fue creado');

        // 3) Crear registro en clients con gym_user_id
        const client = this.clientsRepo.create({
          gymUserId: gymUser.id,
          trainerGymUserId: dto.trainerId ? await getGymUserId(dto.trainerId, RoleEnum.TRAINER) : null,
          nutritionistGymUserId: null,
          privateSessionsNote: null,
        });
        await trx.getRepository(Client).save(client);
        
        console.log('🔵 Client record created');

        // 4) Insertar contactos (si vienen) - usan user.id (global)
        const emergencyContacts: any[] = [];
        // if (dto.emergencyContacts?.length) {
        //   const rows = dto.emergencyContacts.map((c) =>
        //     this.contactsRepo.create({ clientId: user.id, ...c }),
        //   );
        //   await trx.getRepository(EmergencyContact).save(rows);
        //   emergencyContacts = rows;
        // }

        return {
          user,
          client,
          emergencyContacts,
        };
      });
      
      console.log('✅ Transaction completed successfully');
      return result;
    } catch (error) {
      console.error('❌ Error in ClientsService.create:', error);
      console.error('❌ Error stack:', error.stack);
      throw error;
    }
  }

  async findAll(q: QueryClientsDto) {
    try {
      console.log('clients.findAll called with:', q);
      console.log('RoleEnum.CLIENT:', RoleEnum.CLIENT);
      
      // Usar query manual simplificada sin objetos anidados
      const queryRunner = this.usersRepo.manager.connection.createQueryRunner();
      
      let sql = `
        SELECT 
          u.id, u.email, u.first_name as "firstName", u.last_name as "lastName",
          u.full_name as "fullName", u.phone, u.rut, u.birth_date as "birthDate",
          u.gender, u.sex, u.address, u.avatar_url as "avatarUrl",
          (
            SELECT f.id FROM files f 
            WHERE f.uploaded_by_user_id = u.id
            AND f.gym_id = gu.gym_id 
            AND f.purpose = 'AVATAR'
            AND f.status = 'READY'
            ORDER BY f.created_at DESC
            LIMIT 1
          ) as "avatarFileId",
          u.platform_role as "platformRole", u.is_active as "isActive",
          u.created_at as "createdAt", u.updated_at as "updatedAt",
          COUNT(*) OVER() as total
        FROM users u
        INNER JOIN gym_users gu ON gu.user_id = u.id
        INNER JOIN clients c ON c.gym_user_id = gu.id
        WHERE gu.gym_id = $1 
          AND gu.role = $2
          AND u.deleted_at IS NULL
      `;
      
      const params: any[] = [q.gymId, RoleEnum.CLIENT];
      let paramIndex = 3;
      
      if (typeof q.isActive === 'boolean') {
        sql += ` AND gu.is_active = $${paramIndex}`;
        params.push(q.isActive);
        paramIndex++;
      }
      
      if (q.q) {
        const like = `%${q.q}%`;
        sql += ` AND (u.first_name ILIKE $${paramIndex} OR u.last_name ILIKE $${paramIndex} OR u.email ILIKE $${paramIndex} OR u.rut ILIKE $${paramIndex} OR u.phone ILIKE $${paramIndex})`;
        params.push(like);
        paramIndex++;
      }
      
      if (q.trainerId) {
        // Obtener gym_user_id del trainer
        const trainerGymUser = await this.gymUsersRepo.findOne({
          where: { userId: q.trainerId, gymId: q.gymId },
        });
        if (trainerGymUser) {
          sql += ` AND c.trainer_gym_user_id = $${paramIndex}`;
          params.push(trainerGymUser.id);
          paramIndex++;
        } else {
          // Si el trainer no existe en este gym, retornar vacío
          await queryRunner.release();
          return { data: [], total: 0 };
        }
      }
      
      sql += ` ORDER BY u.created_at DESC`;
      sql += ` LIMIT ${q.limit} OFFSET ${q.offset}`;
      
      console.log('SQL (clients):', sql);
      console.log('Params:', params);
      
      const result = await queryRunner.query(sql, params);
      console.log('Query result count:', result.length);
      await queryRunner.release();
      
      const total = result.length > 0 ? parseInt(result[0].total, 10) : 0;
      const data = result.map(row => {
        delete row.total;
        return row;
      });

      return { data, total };
    } catch (error) {
      console.error('Error en clients.findAll:', error);
      console.error('Error message:', error?.message);
      console.error('Error stack:', error?.stack);
      throw error;
    }
  }

  async findOne(userId: string, gymId: string) {
    // Resolver ambiguamente: userId puede ser user.id o gym_user.id
    let gymUser = await this.gymUsersRepo.findOne({
      where: [
        { id: userId, gymId },           // Si userId es gym_user_id
        { userId: userId, gymId },       // Si userId es user_id (legacy)
      ],
    });

    if (!gymUser) throw new NotFoundException('Cliente no encontrado en este gimnasio');

    // Obtener user global
    const user = await this.usersRepo.findOne({ where: { id: gymUser.userId } });
    if (!user) throw new NotFoundException('Usuario no encontrado');

    // Obtener client
    const client = await this.clientsRepo.findOne({ where: { gymUserId: gymUser.id } });
    if (!client) throw new NotFoundException('Ficha de cliente no encontrada');

    // Emergency contacts usan user.id (global)
    const contacts = await this.contactsRepo.find({ where: { clientId: gymUser.userId } });

    return { user, client, emergencyContacts: contacts };
  }

  async update(userId: string, gymId: string, dto: UpdateClientDto) {
    return await this.dataSource.transaction(async (trx) => {
      // Resolver gym_user (acepta user_id o gym_user_id)
      let gymUser = await trx.getRepository(GymUser).findOne({
        where: [
          { id: userId, gymId },
          { userId: userId, gymId },
        ],
      });
      if (!gymUser) throw new NotFoundException('Cliente no encontrado');

      // 1) Update user (global)
      await this.usersService.update(gymUser.userId, gymId, {
        email: dto.email,
        password: dto.password,
        phone: dto.phone,
        rut: dto.rut,
        birthDate: dto.birthDate,
        gender: dto.gender,
        sex: dto.sex,
        address: dto.address,
        avatarUrl: dto.avatarUrl,
        isActive: dto.isActive,
      });

      // 2) Update client
      const client = await trx.getRepository(Client).findOne({ where: { gymUserId: gymUser.id } });
      if (!client) throw new NotFoundException('Ficha de cliente no encontrada');

      // Actualizar trainer_gym_user_id si viene
      if (dto.trainerId !== undefined) {
        if (dto.trainerId) {
          const trainerGymUser = await trx.getRepository(GymUser).findOne({
            where: { userId: dto.trainerId, gymId },
          });
          if (!trainerGymUser) throw new NotFoundException('Trainer no encontrado en este gimnasio');
          client.trainerGymUserId = trainerGymUser.id;
        } else {
          client.trainerGymUserId = null;
        }
      }

      // Actualizar nutritionist_gym_user_id si viene
      if (dto.nutritionistId !== undefined) {
        if (dto.nutritionistId) {
          const nutriGymUser = await trx.getRepository(GymUser).findOne({
            where: { userId: dto.nutritionistId, gymId },
          });
          if (!nutriGymUser) throw new NotFoundException('Nutricionista no encontrado en este gimnasio');
          client.nutritionistGymUserId = nutriGymUser.id;
        } else {
          client.nutritionistGymUserId = null;
        }
      }

      if (dto.privateSessionsNote !== undefined) client.privateSessionsNote = dto.privateSessionsNote;

      await trx.getRepository(Client).save(client);

      // 3) Reemplazar contactos si vienen (usan user.id global)
      if (dto.emergencyContacts) {
        await trx.getRepository(EmergencyContact).delete({ clientId: gymUser.userId });
        if (dto.emergencyContacts.length) {
          const rows = dto.emergencyContacts.map((c) =>
            trx.getRepository(EmergencyContact).create({ clientId: gymUser.userId, ...c }),
          );
          await trx.getRepository(EmergencyContact).save(rows);
        }
      }

      const contacts = await trx.getRepository(EmergencyContact).find({ where: { clientId: gymUser.userId } });
      const user = await this.usersRepo.findOne({ where: { id: gymUser.userId } });

      return { user, client, emergencyContacts: contacts };
    });
  }

  async remove(userId: string, gymId: string) {
    // Resolver gym_user (acepta user_id o gym_user_id)
    let gymUser = await this.gymUsersRepo.findOne({
      where: [
        { id: userId, gymId },
        { userId: userId, gymId },
      ],
    });
    if (!gymUser) throw new NotFoundException('Cliente no encontrado en este gimnasio');

    // Eliminar client (CASCADE debería eliminar gym_user automáticamente si está configurado)
    await this.clientsRepo.delete({ gymUserId: gymUser.id });

    // Eliminar gym_user membership
    await this.gymUsersRepo.delete(gymUser.id);

    // OPCIONAL: Si user no tiene más memberships, eliminar user global
    const otherMemberships = await this.gymUsersRepo.count({ where: { userId: gymUser.userId } });
    if (otherMemberships === 0) {
      await this.usersRepo.softDelete(gymUser.userId);
    }

    return { id: userId };
  }

  // --------- Emergency contacts helpers (opcionales) ---------

  async listContacts(userId: string, gymId: string) {
    // Validar membership via gym_users
    const gymUser = await this.gymUsersRepo.findOne({
      where: [
        { id: userId, gymId },
        { userId: userId, gymId },
      ],
    });
    if (!gymUser) throw new NotFoundException('Cliente no encontrado en este gimnasio');

    // Emergency contacts usan user.id (global)
    return this.contactsRepo.find({ where: { clientId: gymUser.userId }, order: { createdAt: 'DESC' } });
  }

  async replaceContacts(userId: string, gymId: string, items: EmergencyContact[]) {
    // Validar membership via gym_users
    const gymUser = await this.gymUsersRepo.findOne({
      where: [
        { id: userId, gymId },
        { userId: userId, gymId },
      ],
    });
    if (!gymUser) throw new NotFoundException('Cliente no encontrado en este gimnasio');

    // Emergency contacts usan user.id (global)
    await this.contactsRepo.delete({ clientId: gymUser.userId });
    if (items?.length) {
      const rows = items.map((c) => this.contactsRepo.create({ clientId: gymUser.userId, fullName: (c as any).fullName, phone: (c as any).phone, relation: (c as any).relation }));
      await this.contactsRepo.save(rows);
    }
    return this.contactsRepo.find({ where: { clientId: gymUser.userId } });
  }

  // TEMPORAL: Método para eliminar todos los clientes (SOLO DESARROLLO)
  async deleteAllClients(gymId: string) {
    if (!gymId) {
      throw new ConflictException('gymId is required');
    }

    try {
      // Obtener todos los gym_users con role CLIENT de este gym
      const gymUsers = await this.gymUsersRepo.find({
        where: { gymId, role: RoleEnum.CLIENT },
      });

      // Eliminar clients y gym_users
      for (const gu of gymUsers) {
        await this.clientsRepo.delete({ gymUserId: gu.id });
        await this.gymUsersRepo.delete(gu.id);
        
        // Si user no tiene más memberships, eliminar user
        const otherMemberships = await this.gymUsersRepo.count({ where: { userId: gu.userId } });
        if (otherMemberships === 0) {
          await this.usersRepo.softDelete(gu.userId);
        }
      }

      return { 
        message: 'All clients deleted successfully',
        deleted: gymUsers.length
      };
    } catch (error) {
      console.error('Error deleting all clients:', error);
      throw error;
    }
  }
}
