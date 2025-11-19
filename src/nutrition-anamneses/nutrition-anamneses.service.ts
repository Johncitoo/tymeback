import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NutritionAnamnesis } from './entities/nutrition-anamnesis.entity';
import { CreateAnamnesisDto } from './dto/create-anamnesis.dto';
import { UpdateAnamnesisDto } from './dto/update-anamnesis.dto';
import { QueryAnamnesesDto } from './dto/query-anamneses.dto';
import { User, RoleEnum } from '../users/entities/user.entity';

@Injectable()
export class NutritionAnamnesesService {
  constructor(
    @InjectRepository(NutritionAnamnesis)
    private readonly repo: Repository<NutritionAnamnesis>,
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
  ) {}

  private async assertUserInGym(userId: string, gymId: string) {
    const u = await this.usersRepo.findOne({ where: { id: userId, gymId } });
    if (!u) throw new ForbiddenException('Usuario no pertenece al gimnasio');
    return u;
  }

  // ADMIN o NUTRITIONIST pueden crear/editar
  private async assertCanWrite(userId: string, gymId: string) {
    const u = await this.assertUserInGym(userId, gymId);
    if (![RoleEnum.ADMIN, RoleEnum.NUTRITIONIST].includes(u.role)) {
      throw new ForbiddenException('No autorizado');
    }
    return u;
  }

  // ADMIN, NUTRITIONIST, TRAINER pueden leer; CLIENT solo si es su propio registro
  private async assertCanRead(userId: string, gymId: string, clientId?: string) {
    const u = await this.assertUserInGym(userId, gymId);
    if (u.role === RoleEnum.CLIENT && clientId && u.id !== clientId) {
      throw new ForbiddenException('No autorizado');
    }
    return u;
  }

  async create(dto: CreateAnamnesisDto, byUserId: string) {
    if (!dto.gymId) throw new ForbiddenException('gymId es requerido');
    await this.assertCanWrite(byUserId, dto.gymId);

    const row = this.repo.create({
      gymId: dto.gymId,
      clientId: dto.clientId,
      nutritionistId:
        dto.nutritionistId ??
        (await this.usersRepo.findOne({ where: { id: byUserId } }))?.id ??
        null,
      takenAt: dto.takenAt ? new Date(dto.takenAt) : new Date(),
      lifestyle: dto.lifestyle ?? null,
      clinical: dto.clinical ?? null,
      goals: dto.goals ?? null,
      notes: dto.notes ?? null,
    });
    return this.repo.save(row);
  }

  async findAll(q: QueryAnamnesesDto, byUserId: string) {
    if (!q.gymId) throw new ForbiddenException('gymId es requerido');
    await this.assertCanRead(byUserId, q.gymId, q.clientId);

    const qb = this.repo.createQueryBuilder('n').where('n.gym_id = :g', { g: q.gymId });

    if (q.clientId) qb.andWhere('n.client_id = :cid', { cid: q.clientId });
    if (q.nutritionistId) qb.andWhere('n.nutritionist_id = :nid', { nid: q.nutritionistId });

    // Fechas opcionales (solo añadimos condiciones si vienen)
    if (q.dateFrom) qb.andWhere('n.taken_at >= :df', { df: new Date(q.dateFrom) });
    if (q.dateTo) qb.andWhere('n.taken_at <= :dt', { dt: new Date(q.dateTo) });

    qb.orderBy('n.taken_at', 'DESC')
      .skip(q.offset ?? 0)
      .take(q.limit ?? 20);

    const [data, total] = await qb.getManyAndCount();
    return { data, total };
  }

  async findOne(id: string, gymId: string, byUserId: string) {
    const row = await this.repo.findOne({ where: { id, gymId } });
    if (!row) throw new NotFoundException('Anamnesis no encontrada');
    await this.assertCanRead(byUserId, gymId, row.clientId);
    return row;
  }

  async update(id: string, dto: UpdateAnamnesisDto, byUserId: string) {
    if (!dto.gymId) throw new ForbiddenException('gymId es requerido');
    await this.assertCanWrite(byUserId, dto.gymId);
    const row = await this.repo.findOne({ where: { id, gymId: dto.gymId } });
    if (!row) throw new NotFoundException('Anamnesis no encontrada');

    row.nutritionistId = dto.nutritionistId ?? row.nutritionistId;
    row.takenAt = dto.takenAt ? new Date(dto.takenAt) : row.takenAt;
    row.lifestyle = dto.lifestyle ?? row.lifestyle;
    row.clinical = dto.clinical ?? row.clinical;
    row.goals = dto.goals ?? row.goals;
    row.notes = dto.notes ?? row.notes;

    return this.repo.save(row);
  }

  async remove(id: string, gymId: string, byUserId: string) {
    await this.assertCanWrite(byUserId, gymId);
    const row = await this.repo.findOne({ where: { id, gymId } });
    if (!row) throw new NotFoundException('Anamnesis no encontrada');
    await this.repo.remove(row);
    return { ok: true };
  }
}
