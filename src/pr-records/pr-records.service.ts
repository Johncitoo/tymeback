import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { And, Between, MoreThanOrEqual, LessThanOrEqual, Repository } from 'typeorm';
import { PrRecord } from './entities/pr-record.entity';
import { CreatePrDto } from './dto/create-pr.dto';
import { UpdatePrDto } from './dto/update-pr.dto';
import { QueryPrsDto } from './dto/query-prs.dto';
import { SummaryLatestDto } from './dto/summary-latest.dto';
import { User, RoleEnum } from '../users/entities/user.entity';
import { GymUser } from '../gym-users/entities/gym-user.entity';
import { Exercise } from '../exercises/entities/exercise.entity';

@Injectable()
export class PrRecordsService {
  constructor(
    @InjectRepository(PrRecord) private readonly repo: Repository<PrRecord>,
    @InjectRepository(User) private readonly usersRepo: Repository<User>,
    @InjectRepository(GymUser) private readonly gymUsersRepo: Repository<GymUser>,
    @InjectRepository(Exercise) private readonly exRepo: Repository<Exercise>,
  ) {}

  private async assertClientInGym(clientId: string, gymId: string) {
    const gymUser = await this.gymUsersRepo.findOne({ where: { userId: clientId, gymId } });
    if (!gymUser) throw new NotFoundException('Cliente no pertenece al gimnasio');
    if (gymUser.role !== RoleEnum.CLIENT) throw new BadRequestException('El usuario no es CLIENTE');
    
    const u = await this.usersRepo.findOne({ where: { id: clientId } });
    if (!u) throw new NotFoundException('Usuario no encontrado');
    
    return { ...u, role: gymUser.role };
  }

  private async assertExerciseInGym(exerciseId: string, gymId: string) {
    const ex = await this.exRepo.findOne({ where: { id: exerciseId, gymId } });
    if (!ex) throw new NotFoundException('Ejercicio no pertenece al gimnasio');
    return ex;
  }

  private computeOneRm(weightKg: number, reps: number) {
    // Epley: 1RM = w * (1 + r/30)
    return Math.round(weightKg * (1 + reps / 30));
  }

  // ----------------- CRUD -----------------
  async create(dto: CreatePrDto) {
    await this.assertClientInGym(dto.clientId, dto.gymId);
    await this.assertExerciseInGym(dto.exerciseId, dto.gymId);

    const row = this.repo.create({
      gymId: dto.gymId,
      clientId: dto.clientId,
      exerciseId: dto.exerciseId,
      weightKg: dto.weightKg,
      reps: dto.reps,
      recordedAt: dto.recordedAt ? new Date(dto.recordedAt) : new Date(),
      notes: dto.notes ?? null,
      createdByUserId: dto.createdByUserId ?? null,
    });
    const saved = await this.repo.save(row);

    return {
      ...saved,
      oneRmEstimate: this.computeOneRm(saved.weightKg, saved.reps),
    };
  }

  async update(id: string, gymId: string, dto: UpdatePrDto) {
    const r = await this.repo.findOne({ where: { id, gymId } });
    if (!r) throw new NotFoundException('PR no encontrado');

    if (dto.recordedAt) r.recordedAt = new Date(dto.recordedAt);
    if (dto.weightKg != null) r.weightKg = dto.weightKg;
    if (dto.reps != null) r.reps = dto.reps;
    if (dto.notes !== undefined) r.notes = dto.notes ?? null;

    const saved = await this.repo.save(r);
    return { ...saved, oneRmEstimate: this.computeOneRm(saved.weightKg, saved.reps) };
  }

  async remove(id: string, gymId: string) {
    const r = await this.repo.findOne({ where: { id, gymId } });
    if (!r) throw new NotFoundException('PR no encontrado');
    await this.repo.remove(r);
    return { ok: true };
  }

  // ----------------- LISTADOS -----------------
  async findAll(q: QueryPrsDto) {
    const where: any = { gymId: q.gymId, clientId: q.clientId };

    if (q.exerciseId) where.exerciseId = q.exerciseId;

    if (q.dateFrom && q.dateTo) {
      where.recordedAt = Between(new Date(q.dateFrom), new Date(q.dateTo));
    } else if (q.dateFrom) {
      where.recordedAt = MoreThanOrEqual(new Date(q.dateFrom));
    } else if (q.dateTo) {
      where.recordedAt = LessThanOrEqual(new Date(q.dateTo));
    }

    const [data, total] = await this.repo.findAndCount({
      where,
      order: { recordedAt: 'DESC' },
      skip: q.offset ?? 0,
      take: q.limit ?? 50,
      relations: ['exercise'],
    });

    const mapped = data.map((r) => ({
      ...r,
      oneRmEstimate: this.computeOneRm(r.weightKg, r.reps),
    }));

    return { data: mapped, total };
  }

  async byExercise(q: QueryPrsDto) {
    if (!q.exerciseId) throw new BadRequestException('exerciseId requerido');
    return this.findAll(q);
  }

  /**
   * Resumen: último PR por ejercicio (por fecha, no “mejor”).
   * Devuelve: exerciseId, exerciseName, recordedAt, weightKg, reps, oneRmEstimate.
   */
  async summaryLatest(dto: SummaryLatestDto) {
    // Usamos una ventana (row_number) en SQL para quedarnos con el último por ejercicio
    const rows = await this.repo.query(
      `
      SELECT x.exercise_id as "exerciseId",
             e.name         as "exerciseName",
             x.recorded_at  as "recordedAt",
             x.weight_kg    as "weightKg",
             x.reps         as "reps"
      FROM (
        SELECT pr.*,
               ROW_NUMBER() OVER (
                 PARTITION BY pr.exercise_id
                 ORDER BY pr.recorded_at DESC, pr.created_at DESC
               ) AS rn
        FROM pr_records pr
        WHERE pr.gym_id = $1 AND pr.client_id = $2
      ) x
      JOIN exercises e ON e.id = x.exercise_id
      WHERE x.rn = 1
      ORDER BY x.recorded_at DESC;
      `,
      [dto.gymId, dto.clientId],
    );

    const data = rows.map((r: any) => ({
      exerciseId: r.exerciseId,
      exerciseName: r.exerciseName,
      recordedAt: r.recordedAt,
      weightKg: Number(r.weightKg),
      reps: Number(r.reps),
      oneRmEstimate: this.computeOneRm(Number(r.weightKg), Number(r.reps)),
    }));

    return { data };
  }
}
