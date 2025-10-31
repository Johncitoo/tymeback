import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { NutritionPlan } from './entities/nutrition-plan.entity';
import { CreateNutritionPlanDto } from './dto/create-nutrition-plan.dto';
import { UpdateNutritionPlanDto } from './dto/update-nutrition-plan.dto';
import { QueryNutritionPlansDto } from './dto/query-nutrition-plans.dto';
import { User, RoleEnum } from '../users/entities/user.entity';

@Injectable()
export class NutritionPlansService {
  constructor(
    @InjectRepository(NutritionPlan)
    private readonly repo: Repository<NutritionPlan>,
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
  ) {}

  // ---------- helpers ----------
  private async assertGymUser(userId: string, gymId: string): Promise<User> {
    const u = await this.usersRepo.findOne({ where: { id: userId, gymId } });
    if (!u) throw new NotFoundException('Usuario no pertenece al gimnasio');
    return u;
  }

  private async assertClient(clientId: string, gymId: string): Promise<User> {
    const u = await this.assertGymUser(clientId, gymId);
    if (u.role !== RoleEnum.CLIENT) throw new BadRequestException('No es cliente');
    return u;
  }

  private async assertNutriOrAdmin(userId: string, gymId: string): Promise<User> {
    const u = await this.assertGymUser(userId, gymId);
    if (u.role !== RoleEnum.NUTRITIONIST && u.role !== RoleEnum.ADMIN) {
      throw new ForbiddenException('Requiere rol NUTRITIONIST o ADMIN');
    }
    return u;
  }

  // ---------- create ----------
  async create(dto: CreateNutritionPlanDto) {
    await this.assertClient(dto.clientId, dto.gymId);
    const author = await this.assertNutriOrAdmin(dto.createdByUserId, dto.gymId);

    const nutritionistId =
      dto.nutritionistId ?? (author.role === RoleEnum.NUTRITIONIST ? author.id : null);

    const row = this.repo.create({
      gymId: dto.gymId,
      clientId: dto.clientId,
      nutritionistId,
      name: dto.name,
      description: dto.description ?? null,
      fileId: dto.fileId ?? null,
      pdfUrl: dto.pdfUrl ?? null,
      validFrom: dto.validFrom ?? null,
      validUntil: dto.validUntil ?? null,
      isActive: dto.isActive ?? true,
    });
    return this.repo.save(row);
  }

  // ---------- update ----------
  async update(id: string, dto: UpdateNutritionPlanDto) {
    const row = await this.repo.findOne({ where: { id, gymId: dto.gymId } });
    if (!row) throw new NotFoundException('Plan de nutrición no encontrado');

    await this.assertNutriOrAdmin(dto.updatedByUserId, dto.gymId);

    if (dto.name !== undefined) row.name = dto.name;
    if (dto.description !== undefined) row.description = dto.description ?? null;
    if (dto.fileId !== undefined) row.fileId = dto.fileId ?? null;
    if (dto.pdfUrl !== undefined) row.pdfUrl = dto.pdfUrl ?? null;
    if (dto.validFrom !== undefined) row.validFrom = dto.validFrom ?? null;
    if (dto.validUntil !== undefined) row.validUntil = dto.validUntil ?? null;
    if (dto.isActive !== undefined) row.isActive = dto.isActive;

    return this.repo.save(row);
  }

  // ---------- list ----------
  async findAll(q: QueryNutritionPlansDto) {
    const qb: SelectQueryBuilder<NutritionPlan> = this.repo
      .createQueryBuilder('np')
      .where('np.gym_id = :g', { g: q.gymId });

    if (q.clientId) qb.andWhere('np.client_id = :c', { c: q.clientId });
    if (q.nutritionistId) qb.andWhere('np.nutritionist_id = :n', { n: q.nutritionistId });
    if (typeof q.isActive === 'string') {
      qb.andWhere('np.is_active = :ia', { ia: q.isActive === 'true' });
    }

    // Solapamiento de rango de vigencia: (valid_from <= dateTo) AND (valid_until >= dateFrom)
    // admitiendo nulos (sin fecha = sin restricción)
    if (q.dateFrom && q.dateTo) {
      qb.andWhere(
        '( (np.valid_from IS NULL OR np.valid_from <= :to) AND (np.valid_until IS NULL OR np.valid_until >= :from) )',
        { from: q.dateFrom, to: q.dateTo },
      );
    } else if (q.dateFrom) {
      qb.andWhere('(np.valid_until IS NULL OR np.valid_until >= :from)', { from: q.dateFrom });
    } else if (q.dateTo) {
      qb.andWhere('(np.valid_from IS NULL OR np.valid_from <= :to)', { to: q.dateTo });
    }

    qb.orderBy('np.created_at', 'DESC').skip(q.offset ?? 0).take(q.limit ?? 20);

    const [data, total] = await qb.getManyAndCount();
    return { data, total };
  }

  // ---------- get one ----------
  async findOne(id: string, gymId: string) {
    const row = await this.repo.findOne({ where: { id, gymId } });
    if (!row) throw new NotFoundException('Plan de nutrición no encontrado');
    return row;
  }

  // ---------- delete (hard) ----------
  async remove(id: string, gymId: string, byUserId: string) {
    await this.assertNutriOrAdmin(byUserId, gymId);
    const row = await this.repo.findOne({ where: { id, gymId } });
    if (!row) throw new NotFoundException('Plan de nutrición no encontrado');
    await this.repo.remove(row);
    return { ok: true };
  }
}
