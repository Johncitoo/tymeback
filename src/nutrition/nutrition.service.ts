// src/nutrition/nutrition.service.ts
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, MoreThanOrEqual, LessThanOrEqual, Repository } from 'typeorm';
import { NutritionAnamnesis } from './entities/nutrition-anamnesis.entity';
import { BodyEvaluation } from './entities/body-evaluation.entity';
import { InbodyScan } from './entities/inbody-scan.entity';
import { NutritionPlan } from './entities/nutrition-plan.entity';
import { CreateAnamnesisDto } from './dto/create-anamnesis.dto';
import { UpdateAnamnesisDto } from './dto/update-anamnesis.dto';
import { QueryAnamnesesDto } from './dto/query-anamneses.dto';
import { CreateBodyEvalDto } from './dto/create-body-eval.dto';
import { UpdateBodyEvalDto } from './dto/update-body-eval.dto';
import { QueryBodyEvalsDto } from './dto/query-body-evals.dto';
import { CreateInbodyDto } from './dto/create-inbody.dto';
import { UpdateInbodyDto } from './dto/update-inbody.dto';
import { QueryInbodyDto } from './dto/query-inbody.dto';
import { CreateNutritionPlanDto } from './dto/create-nutrition-plan.dto';
import { UpdateNutritionPlanDto } from './dto/update-nutrition-plan.dto';
import { QueryNutritionPlansDto } from './dto/query-nutrition-plans.dto';
import { User, RoleEnum } from '../users/entities/user.entity';
import { GymUser } from '../gym-users/entities/gym-user.entity';

@Injectable()
export class NutritionService {
  constructor(
    @InjectRepository(NutritionAnamnesis) private readonly anamRepo: Repository<NutritionAnamnesis>,
    @InjectRepository(BodyEvaluation)    private readonly bodyRepo: Repository<BodyEvaluation>,
    @InjectRepository(InbodyScan)        private readonly inbRepo: Repository<InbodyScan>,
    @InjectRepository(NutritionPlan)     private readonly planRepo: Repository<NutritionPlan>,
    @InjectRepository(User)              private readonly usersRepo: Repository<User>,
    @InjectRepository(GymUser)           private readonly gymUsersRepo: Repository<GymUser>,
  ) {}

  // -------- helpers ----------
  private clampListParams<T extends { offset?: number; limit?: number }>(q: T): T {
    const offset = Math.max(0, Number(q.offset ?? 0));
    const limit = Math.min(100, Math.max(1, Number(q.limit ?? 20)));
    return { ...q, offset, limit };
  }

  private normalizeRange(from?: string, to?: string): { from?: Date; to?: Date } {
    if (!from && !to) return {};
    const df = from ? new Date(from) : undefined;
    const dt = to ? new Date(to) : undefined;
    if (df && dt && df.getTime() > dt.getTime()) {
      // si vienen invertidas, las cambiamos
      return { from: dt, to: df };
    }
    return { from: df, to: dt };
  }

  private async assertWriter(byUserId: string, gymId: string) {
    const gymUser = await this.gymUsersRepo.findOne({ where: { userId: byUserId, gymId } });
    if (!gymUser) throw new NotFoundException('Usuario no pertenece al gimnasio');
    if (![RoleEnum.ADMIN, RoleEnum.NUTRITIONIST].includes(gymUser.role)) {
      throw new ForbiddenException('Solo ADMIN o NUTRITIONIST pueden escribir');
    }
    
    const u = await this.usersRepo.findOne({ where: { id: byUserId } });
    if (!u) throw new NotFoundException('Usuario no encontrado');
    
    return { ...u, role: gymUser.role };
  }

  private async assertClient(clientId: string, gymId: string) {
    const gymUser = await this.gymUsersRepo.findOne({ where: { userId: clientId, gymId } });
    if (!gymUser) throw new NotFoundException('Cliente no pertenece al gimnasio');
    if (gymUser.role !== RoleEnum.CLIENT) throw new BadRequestException('No es cliente');
    
    const u = await this.usersRepo.findOne({ where: { id: clientId } });
    if (!u) throw new NotFoundException('Usuario no encontrado');
    
    return { ...u, role: gymUser.role };
  }

  // ------------------ ANAMNESIS ------------------
  async createAnamnesis(dto: CreateAnamnesisDto) {
    await this.assertWriter(dto.byUserId, dto.gymId);
    await this.assertClient(dto.clientId, dto.gymId);

    const row = this.anamRepo.create({
      gymId: dto.gymId,
      clientId: dto.clientId,
      nutritionistId: dto.nutritionistId ?? dto.byUserId,
      takenAt: dto.takenAt ? new Date(dto.takenAt) : new Date(),
      lifestyle: dto.lifestyle ?? null,
      clinical: dto.clinical ?? null,
      goals: dto.goals ?? null,
      notes: dto.notes ?? null,
    });
    return this.anamRepo.save(row);
  }

  async updateAnamnesis(id: string, gymId: string, dto: UpdateAnamnesisDto) {
    await this.assertWriter(dto.byUserId!, gymId);
    const row = await this.anamRepo.findOne({ where: { id, gymId } });
    if (!row) throw new NotFoundException('Anamnesis no encontrada');
    Object.assign(row, {
      nutritionistId: dto.nutritionistId ?? row.nutritionistId,
      takenAt: dto.takenAt ? new Date(dto.takenAt) : row.takenAt,
      lifestyle: dto.lifestyle ?? row.lifestyle,
      clinical: dto.clinical ?? row.clinical,
      goals: dto.goals ?? row.goals,
      notes: dto.notes ?? row.notes,
    });
    return this.anamRepo.save(row);
  }

  async listAnamneses(q: QueryAnamnesesDto) {
    const Q = this.clampListParams(q);
    const where: any = { gymId: Q.gymId };
    if (Q.clientId) where.clientId = Q.clientId;

    const r = this.normalizeRange(Q.from, Q.to);
    if (r.from && r.to) where.takenAt = Between(r.from, r.to);
    else if (r.from) where.takenAt = MoreThanOrEqual(r.from);
    else if (r.to) where.takenAt = LessThanOrEqual(r.to);

    const [data, total] = await this.anamRepo.findAndCount({
      where,
      order: { takenAt: 'DESC' },
      skip: Q.offset,
      take: Q.limit,
    });
    return { data, total };
  }

  async removeAnamnesis(id: string, gymId: string, byUserId: string) {
    await this.assertWriter(byUserId, gymId);
    const row = await this.anamRepo.findOne({ where: { id, gymId } });
    if (!row) throw new NotFoundException('Anamnesis no encontrada');
    await this.anamRepo.remove(row);
    return { ok: true };
  }

  // ------------------ BODY EVALUATIONS ------------------
  async createBodyEval(dto: CreateBodyEvalDto) {
    await this.assertWriter(dto.byUserId, dto.gymId);
    await this.assertClient(dto.clientId, dto.gymId);

    const row = this.bodyRepo.create({
      gymId: dto.gymId,
      clientId: dto.clientId,
      nutritionistId: dto.nutritionistId ?? dto.byUserId,
      measuredAt: dto.measuredAt ? new Date(dto.measuredAt) : new Date(),
      data: dto.data,
      notes: dto.notes ?? null,
    });
    return this.bodyRepo.save(row);
  }

  async updateBodyEval(id: string, gymId: string, dto: UpdateBodyEvalDto) {
    await this.assertWriter(dto.byUserId!, gymId);
    const row = await this.bodyRepo.findOne({ where: { id, gymId } });
    if (!row) throw new NotFoundException('Evaluación no encontrada');
    Object.assign(row, {
      nutritionistId: dto.nutritionistId ?? row.nutritionistId,
      measuredAt: dto.measuredAt ? new Date(dto.measuredAt) : row.measuredAt,
      data: dto.data ?? row.data,
      notes: dto.notes ?? row.notes,
    });
    return this.bodyRepo.save(row);
  }

  async listBodyEvals(q: QueryBodyEvalsDto) {
    const Q = this.clampListParams(q);
    const where: any = { gymId: Q.gymId };
    if (Q.clientId) where.clientId = Q.clientId;

    const r = this.normalizeRange(Q.from, Q.to);
    if (r.from && r.to) where.measuredAt = Between(r.from, r.to);
    else if (r.from) where.measuredAt = MoreThanOrEqual(r.from);
    else if (r.to) where.measuredAt = LessThanOrEqual(r.to);

    const [data, total] = await this.bodyRepo.findAndCount({
      where,
      order: { measuredAt: 'DESC' },
      skip: Q.offset,
      take: Q.limit,
    });
    return { data, total };
  }

  async removeBodyEval(id: string, gymId: string, byUserId: string) {
    await this.assertWriter(byUserId, gymId);
    const row = await this.bodyRepo.findOne({ where: { id, gymId } });
    if (!row) throw new NotFoundException('Evaluación no encontrada');
    await this.bodyRepo.remove(row);
    return { ok: true };
  }

  // ------------------ INBODY SCANS ------------------
  async createInbody(dto: CreateInbodyDto) {
    await this.assertWriter(dto.byUserId, dto.gymId);
    await this.assertClient(dto.clientId, dto.gymId);

    const row = this.inbRepo.create({
      gymId: dto.gymId,
      clientId: dto.clientId,
      nutritionistId: dto.nutritionistId ?? dto.byUserId,
      scanDate: dto.scanDate ? new Date(dto.scanDate) : new Date(),
      data: dto.data ?? null,
      fileId: dto.fileId ?? null,
      notes: dto.notes ?? null,
    });
    return this.inbRepo.save(row);
  }

  async updateInbody(id: string, gymId: string, dto: UpdateInbodyDto) {
    await this.assertWriter(dto.byUserId!, gymId);
    const row = await this.inbRepo.findOne({ where: { id, gymId } });
    if (!row) throw new NotFoundException('InBody no encontrado');
    Object.assign(row, {
      nutritionistId: dto.nutritionistId ?? row.nutritionistId,
      scanDate: dto.scanDate ? new Date(dto.scanDate) : row.scanDate,
      data: dto.data ?? row.data,
      fileId: dto.fileId ?? row.fileId,
      notes: dto.notes ?? row.notes,
    });
    return this.inbRepo.save(row);
  }

  async listInbody(q: QueryInbodyDto) {
    const Q = this.clampListParams(q);
    const where: any = { gymId: Q.gymId };
    if (Q.clientId) where.clientId = Q.clientId;

    const r = this.normalizeRange(Q.from, Q.to);
    if (r.from && r.to) where.scanDate = Between(r.from, r.to);
    else if (r.from) where.scanDate = MoreThanOrEqual(r.from);
    else if (r.to) where.scanDate = LessThanOrEqual(r.to);

    const [data, total] = await this.inbRepo.findAndCount({
      where,
      order: { scanDate: 'DESC' },
      skip: Q.offset,
      take: Q.limit,
    });
    return { data, total };
  }

  async removeInbody(id: string, gymId: string, byUserId: string) {
    await this.assertWriter(byUserId, gymId);
    const row = await this.inbRepo.findOne({ where: { id, gymId } });
    if (!row) throw new NotFoundException('InBody no encontrado');
    await this.inbRepo.remove(row);
    return { ok: true };
  }

  // ------------------ NUTRITION PLANS ------------------
  async createPlan(dto: CreateNutritionPlanDto) {
    await this.assertWriter(dto.byUserId, dto.gymId);
    await this.assertClient(dto.clientId, dto.gymId);

    // XOR: fileId vs pdfUrl
    if (dto.fileId && dto.pdfUrl) {
      throw new BadRequestException('Usa archivo (fileId) o URL (pdfUrl), no ambos');
    }

    const row = this.planRepo.create({
      gymId: dto.gymId,
      clientId: dto.clientId,
      nutritionistId: dto.nutritionistId ?? dto.byUserId,
      name: dto.name,
      description: dto.description ?? null,
      fileId: dto.fileId ?? null,
      pdfUrl: dto.pdfUrl ?? null,
      validFrom: dto.validFrom ?? null,
      validUntil: dto.validUntil ?? null,
      isActive: typeof dto.isActive === 'boolean' ? dto.isActive : true,
    });
    return this.planRepo.save(row);
  }

  async updatePlan(id: string, gymId: string, dto: UpdateNutritionPlanDto) {
    await this.assertWriter(dto.byUserId!, gymId);
    const row = await this.planRepo.findOne({ where: { id, gymId } });
    if (!row) throw new NotFoundException('Plan de nutrición no encontrado');

    // XOR también en update
    if (dto.fileId && dto.pdfUrl) {
      throw new BadRequestException('Usa archivo (fileId) o URL (pdfUrl), no ambos');
    }

    Object.assign(row, {
      nutritionistId: dto.nutritionistId ?? row.nutritionistId,
      name: dto.name ?? row.name,
      description: dto.description ?? row.description,
      fileId: dto.fileId ?? row.fileId,
      pdfUrl: dto.pdfUrl ?? row.pdfUrl,
      validFrom: dto.validFrom ?? row.validFrom,
      validUntil: dto.validUntil ?? row.validUntil,
      isActive: typeof dto.isActive === 'boolean' ? dto.isActive : row.isActive,
    });
    return this.planRepo.save(row);
  }

  async listPlans(q: QueryNutritionPlansDto) {
    const Q = this.clampListParams(q);
    const where: any = { gymId: Q.gymId };
    if (Q.clientId) where.clientId = Q.clientId;
    if (typeof Q.isActive === 'boolean') where.isActive = Q.isActive;

    const [data, total] = await this.planRepo.findAndCount({
      where,
      order: { updatedAt: 'DESC' },
      skip: Q.offset,
      take: Q.limit,
    });
    return { data, total };
  }

  async setActive(id: string, gymId: string, byUserId: string, active: boolean) {
    await this.assertWriter(byUserId, gymId);
    const row = await this.planRepo.findOne({ where: { id, gymId } });
    if (!row) throw new NotFoundException('Plan de nutrición no encontrado');
    row.isActive = active;
    return this.planRepo.save(row);
  }

  async removePlan(id: string, gymId: string, byUserId: string) {
    await this.assertWriter(byUserId, gymId);
    const row = await this.planRepo.findOne({ where: { id, gymId } });
    if (!row) throw new NotFoundException('Plan de nutrición no encontrado');
    await this.planRepo.remove(row);
    return { ok: true };
  }
}
