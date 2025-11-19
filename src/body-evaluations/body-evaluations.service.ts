import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, LessThanOrEqual, MoreThanOrEqual, Repository } from 'typeorm';
import { BodyEvaluation } from './entities/body-evaluation.entity';
import { CreateBodyEvaluationDto } from './dto/create-body-evaluation.dto';
import { UpdateBodyEvaluationDto } from './dto/update-body-evaluation.dto';
import { QueryBodyEvaluationsDto } from './dto/query-body-evaluations.dto';
import { User, RoleEnum } from '../users/entities/user.entity';

@Injectable()
export class BodyEvaluationsService {
  constructor(
    @InjectRepository(BodyEvaluation)
    private readonly repo: Repository<BodyEvaluation>,
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
  ) {}

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

  // ---- CREATE ----
  async create(dto: CreateBodyEvaluationDto) {
    if (!dto.gymId) throw new BadRequestException('gymId es requerido');
    await this.assertClient(dto.clientId, dto.gymId);
    const author = await this.assertNutriOrAdmin(dto.createdByUserId, dto.gymId);

    const nutritionistId =
      dto.nutritionistId ?? (author.role === RoleEnum.NUTRITIONIST ? author.id : null);

    const row = this.repo.create({
      gymId: dto.gymId,
      clientId: dto.clientId,
      nutritionistId,
      measuredAt: dto.measuredAt ? new Date(dto.measuredAt) : new Date(),
      data: dto.data,
      notes: dto.notes ?? null,
    });
    return this.repo.save(row);
  }

  // ---- UPDATE ----
  async update(id: string, dto: UpdateBodyEvaluationDto) {
    if (!dto.gymId) throw new BadRequestException('gymId es requerido');
    const row = await this.repo.findOne({ where: { id, gymId: dto.gymId } });
    if (!row) throw new NotFoundException('Evaluación no encontrada');

    await this.assertNutriOrAdmin(dto.updatedByUserId, dto.gymId);

    if (dto.measuredAt !== undefined) row.measuredAt = new Date(dto.measuredAt);
    if (dto.data !== undefined) row.data = dto.data;
    if (dto.notes !== undefined) row.notes = dto.notes;

    return this.repo.save(row);
  }

  // ---- LIST ----
  async findAll(q: QueryBodyEvaluationsDto) {
    const where: any = { gymId: q.gymId };
    if (q.clientId) where.clientId = q.clientId;

    if (q.dateFrom && q.dateTo) {
      where.measuredAt = Between(new Date(q.dateFrom), new Date(q.dateTo));
    } else if (q.dateFrom) {
      where.measuredAt = MoreThanOrEqual(new Date(q.dateFrom));
    } else if (q.dateTo) {
      where.measuredAt = LessThanOrEqual(new Date(q.dateTo));
    }

    const [data, total] = await this.repo.findAndCount({
      where,
      order: { measuredAt: 'DESC' },
      skip: q.offset ?? 0,
      take: q.limit ?? 20,
    });

    return { data, total };
  }

  // ---- GET ONE ----
  async findOne(id: string, gymId: string) {
    const row = await this.repo.findOne({ where: { id, gymId } });
    if (!row) throw new NotFoundException('Evaluación no encontrada');
    return row;
  }

  // ---- DELETE (hard) ----
  async remove(id: string, gymId: string, byUserId: string) {
    await this.assertNutriOrAdmin(byUserId, gymId);
    const row = await this.repo.findOne({ where: { id, gymId } });
    if (!row) throw new NotFoundException('Evaluación no encontrada');
    await this.repo.remove(row);
    return { ok: true };
  }
}
