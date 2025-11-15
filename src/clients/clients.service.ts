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
    private readonly usersService: UsersService,
    private readonly dataSource: DataSource,
  ) {}

  async create(dto: CreateClientDto) {
    // Validar trainer/nutritionist pertenecen al mismo gym y rol correcto (si vienen)
    const validateStaff = async (id?: string | null, role?: RoleEnum, gymId?: string) => {
      if (!id || !gymId) return null;
      const u = await this.usersRepo.findOne({ where: { id: id as string, gymId } });
      if (!u) throw new NotFoundException(`Usuario staff no encontrado (${id})`);
      if (role && u.role !== role) {
        throw new ConflictException(`El usuario ${id} no es ${role}`);
      }
      return u.id;
    };

    return await this.dataSource.transaction(async (trx) => {
      // 1) Crear usuario con rol CLIENT
      const user = await this.usersService.create({
        gymId: dto.gymId,
        role: RoleEnum.CLIENT,
        fullName: `${dto.firstName} ${dto.lastName}`,
        email: dto.email ?? '',
        password: 'temporal123', // Debe venir del dto o generar una temporal
        phone: dto.phone,
        rut: dto.rut,
        birthDate: dto.birthDate,
        gender: dto.gender as any, // Conversión de GenderIdentityEnum a GenderEnum
        sex: dto.biologicalSex as any,
        address: dto.address,
        avatarUrl: dto.avatarUrl,
        isActive: true,
      });

      // 2) Crear registro en clients
      const client = this.clientsRepo.create({
        userId: user.id,
        trainerId: await validateStaff(dto.trainerId, RoleEnum.TRAINER, dto.gymId),
        nutritionistId: null,
        privateSessionsNote: null,
      });
      await trx.getRepository(Client).save(client);

      // 3) Insertar contactos (si vienen)
      const emergencyContacts: any[] = [];
      // if (dto.emergencyContacts?.length) {
      //   const rows = dto.emergencyContacts.map((c) =>
      //     this.contactsRepo.create({ clientId: user.id, ...c }),
      //   );
      //   await trx.getRepository(EmergencyContact).save(rows);
      //   emergencyContacts = rows;
      // }

      // Respuesta combinada mínima
      return {
        user,
        client,
        emergencyContacts,
      };
    });
  }

  async findAll(q: QueryClientsDto) {
    // Simplificado: buscar users con role CLIENT y luego filtrar
    const where: any = { 
      role: RoleEnum.CLIENT,
      deletedAt: IsNull() 
    };
    
    // TODO: Filtrar por gymId cuando esté disponible en el contexto
    if (q.gymId) where.gymId = q.gymId;
    if (typeof q.isActive === 'boolean') where.isActive = q.isActive;

    const qb = this.usersRepo.createQueryBuilder('u').where(where);

    // Filtro por búsqueda de texto
    if (q.q) {
      const like = `%${q.q}%`;
      qb.andWhere(
        '(u.full_name ILIKE :like OR u.email ILIKE :like OR u.rut ILIKE :like OR u.phone ILIKE :like)',
        { like },
      );
    }

    const [data, total] = await qb
      .orderBy('u.created_at', 'DESC')
      .skip(q.offset)
      .take(q.limit)
      .getManyAndCount();

    // Adjunta info de client (trainerId/nutritionistId) en bloque
    const ids = data.map((u) => u.id);
    
    let clientRows: Client[] = [];
    if (ids.length > 0) {
      const qbClients = this.clientsRepo.createQueryBuilder('c');
      qbClients.where('c.userId IN (:...ids)', { ids });
      
      // Si se filtró por trainerId, también filtrar aquí
      if (q.trainerId) {
        qbClients.andWhere('c.trainerId = :tid', { tid: q.trainerId });
      }
      
      clientRows = await qbClients.getMany();
    }
    
    const byId = new Map(clientRows.map((c) => [c.userId, c]));
    const result = data.map((u) => ({
      ...u,
      client: byId.get(u.id) || null,
    }));

    return { data: result, total };
  }

  async findOne(userId: string, gymId: string) {
    const user = await this.usersRepo.findOne({ where: { id: userId, gymId } });
    if (!user) throw new NotFoundException('Cliente no encontrado');

    const client = await this.clientsRepo.findOne({ where: { userId } });
    if (!client) throw new NotFoundException('Ficha de cliente no encontrada');

    const contacts = await this.contactsRepo.find({ where: { clientId: userId } });

    return { user, client, emergencyContacts: contacts };
  }

  async update(userId: string, gymId: string, dto: UpdateClientDto) {
    return await this.dataSource.transaction(async (trx) => {
      // 1) Update user (soft validations)
      await this.usersService.update(userId, gymId, {
        fullName: dto.fullName,
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
      const client = await trx.getRepository(Client).findOne({ where: { userId } });
      if (!client) throw new NotFoundException('Ficha de cliente no encontrada');

      if (dto.trainerId !== undefined) client.trainerId = dto.trainerId;
      if (dto.nutritionistId !== undefined) client.nutritionistId = dto.nutritionistId;
      if (dto.privateSessionsNote !== undefined) client.privateSessionsNote = dto.privateSessionsNote;

      await trx.getRepository(Client).save(client);

      // 3) Reemplazar contactos si vienen
      if (dto.emergencyContacts) {
        await trx.getRepository(EmergencyContact).delete({ clientId: userId });
        if (dto.emergencyContacts.length) {
          const rows = dto.emergencyContacts.map((c) =>
            trx.getRepository(EmergencyContact).create({ clientId: userId, ...c }),
          );
          await trx.getRepository(EmergencyContact).save(rows);
        }
      }

      const contacts = await trx.getRepository(EmergencyContact).find({ where: { clientId: userId } });
      const user = await this.usersRepo.findOne({ where: { id: userId, gymId } });

      return { user, client, emergencyContacts: contacts };
    });
  }

  async remove(userId: string, gymId: string) {
    // Soft-delete de users; mantiene clients/emergency_contacts
    const res = await this.usersRepo.softDelete({ id: userId, gymId });
    if (!res.affected) throw new NotFoundException('Cliente no encontrado');
    return { id: userId };
  }

  // --------- Emergency contacts helpers (opcionales) ---------

  async listContacts(userId: string, gymId: string) {
    const user = await this.usersRepo.findOne({ where: { id: userId, gymId } });
    if (!user) throw new NotFoundException('Cliente no encontrado');
    return this.contactsRepo.find({ where: { clientId: userId }, order: { createdAt: 'DESC' } });
  }

  async replaceContacts(userId: string, gymId: string, items: EmergencyContact[]) {
    const user = await this.usersRepo.findOne({ where: { id: userId, gymId } });
    if (!user) throw new NotFoundException('Cliente no encontrado');
    await this.contactsRepo.delete({ clientId: userId });
    if (items?.length) {
      const rows = items.map((c) => this.contactsRepo.create({ clientId: userId, fullName: (c as any).fullName, phone: (c as any).phone, relation: (c as any).relation }));
      await this.contactsRepo.save(rows);
    }
    return this.contactsRepo.find({ where: { clientId: userId } });
  }
}
