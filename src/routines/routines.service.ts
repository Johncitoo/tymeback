import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { Routine } from './entities/routine.entity';
import { RoutineDay } from './entities/routine-day.entity';
import { RoutineDayExercise } from './entities/routine-day-exercise.entity';
import { RoutineAssignment } from './entities/routine-assignment.entity';
import { CreateRoutineDto } from './dto/create-routine.dto';
import { UpdateRoutineDto } from './dto/update-routine.dto';
import { QueryRoutinesDto } from './dto/query-routines.dto';
import { AddDayDto } from './dto/add-day.dto';
import { AddExerciseDto } from './dto/add-exercise.dto';
import { ReorderDayExercisesDto } from './dto/reorder-day-exercises.dto';
import { AssignRoutineDto } from './dto/assign-routine.dto';
import { UpdateExerciseOverrideDto } from './dto/update-exercise-override.dto';
import { QueryAssignmentsDto } from './dto/query-assignments.dto';
import { Exercise } from '../exercises/entities/exercise.entity';

@Injectable()
export class RoutinesService {
  constructor(
    @InjectRepository(Routine) private readonly routineRepo: Repository<Routine>,
    @InjectRepository(RoutineDay) private readonly dayRepo: Repository<RoutineDay>,
    @InjectRepository(RoutineDayExercise) private readonly rdeRepo: Repository<RoutineDayExercise>,
    @InjectRepository(RoutineAssignment) private readonly assignRepo: Repository<RoutineAssignment>,
    @InjectRepository(Exercise) private readonly exRepo: Repository<Exercise>,
  ) {}

  // ---- helpers ----
  private async getRoutineOrThrow(id: string, gymId: string) {
    const r = await this.routineRepo.findOne({ where: { id, gymId } });
    if (!r) throw new NotFoundException('Rutina no encontrada');
    return r;
  }

  private async getDayOrThrow(id: string, gymId: string) {
    const d = await this.dayRepo.findOne({ where: { id, gymId } });
    if (!d) throw new NotFoundException('Día no encontrado');
    return d;
  }

  private async getRdeOrThrow(id: string, gymId: string) {
    const e = await this.rdeRepo.findOne({ where: { id, gymId } });
    if (!e) throw new NotFoundException('Ejercicio del día no encontrado');
    return e;
  }

  // ---- routines ----
  async createRoutine(dto: CreateRoutineDto) {
    // nombre único por gym (case-insensitive)
    const dup = await this.routineRepo.findOne({
      where: { gymId: dto.gymId, name: ILike(dto.name) },
    });
    if (dup) throw new BadRequestException('Ya existe una rutina con ese nombre');

    const row = this.routineRepo.create({
      gymId: dto.gymId,
      name: dto.name,
      description: dto.description ?? null,
      createdByUserId: dto.createdByUserId ?? null,
      isActive: dto.isActive ?? true,
    });
    return this.routineRepo.save(row);
  }

  async updateRoutine(id: string, gymId: string, dto: UpdateRoutineDto) {
    const r = await this.getRoutineOrThrow(id, gymId);

    if (dto.name && dto.name !== r.name) {
      const dup = await this.routineRepo.findOne({
        where: { gymId, name: ILike(dto.name) },
      });
      if (dup) throw new BadRequestException('Ya existe una rutina con ese nombre');
    }

    Object.assign(r, {
      name: dto.name ?? r.name,
      description: dto.description ?? r.description,
      createdByUserId: dto.createdByUserId ?? r.createdByUserId,
      isActive: typeof dto.isActive === 'boolean' ? dto.isActive : r.isActive,
    });

    return this.routineRepo.save(r);
  }

  async listRoutines(q: QueryRoutinesDto) {
    const where: any = { gymId: q.gymId };
    if (q.search) where.name = ILike(`%${q.search}%`);
    if (typeof q.isActive === 'string') where.isActive = q.isActive === 'true';

    const [data, total] = await this.routineRepo.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip: q.offset ?? 0,
      take: q.limit ?? 20,
    });

    // conteo de asignaciones
    const ids = data.map((r) => r.id);
    let counts: Record<string, number> = {};
    if (ids.length) {
      const raw = await this.assignRepo
        .createQueryBuilder('a')
        .select('a.routine_id', 'rid')
        .addSelect('COUNT(*)::int', 'n')
        .where('a.gym_id = :g AND a.is_active = true', { g: q.gymId })
        .andWhere('a.routine_id IN (:...ids)', { ids })
        .groupBy('a.routine_id')
        .getRawMany<{ rid: string; n: number }>();
      counts = Object.fromEntries(raw.map((r) => [r.rid, Number(r.n)]));
    }

    return {
      data: data.map((r) => ({ ...r, assignedCount: counts[r.id] ?? 0 })),
      total,
    };
  }

  async findRoutine(id: string, gymId: string) {
    const r = await this.getRoutineOrThrow(id, gymId);
    const days = await this.dayRepo.find({ where: { gymId, routineId: id }, order: { dayIndex: 'ASC' } });
    const dayIds = days.map((d) => d.id);
    const rdes = dayIds.length
      ? await this.rdeRepo.find({
          where: { gymId, routineId: id },
          order: { orderIndex: 'ASC' },
        })
      : [];
    return { routine: r, days, exercises: rdes };
  }

  // ---- days ----
  async addDay(dto: AddDayDto) {
    await this.getRoutineOrThrow(dto.routineId, dto.gymId);

    const exists = await this.dayRepo.findOne({
      where: { gymId: dto.gymId, routineId: dto.routineId, dayIndex: dto.dayIndex },
    });
    if (exists) throw new BadRequestException('Ese índice de día ya existe en esta rutina');

    const row = this.dayRepo.create({
      gymId: dto.gymId,
      routineId: dto.routineId,
      dayIndex: dto.dayIndex,
      name: dto.name ?? null,
    });
    return this.dayRepo.save(row);
  }

  // ---- day exercises ----
  async addExercise(dto: AddExerciseDto) {
    const day = await this.getDayOrThrow(dto.dayId, dto.gymId);
    // valida que el exercise exista y sea del mismo gimnasio
    const ex = await this.exRepo.findOne({ where: { id: dto.exerciseId, gymId: dto.gymId } });
    if (!ex) throw new BadRequestException('Ejercicio inválido para este gimnasio');

    // próximo orderIndex si no lo envían
    let orderIndex = dto.orderIndex ?? 0;
    if (dto.orderIndex === undefined) {
      const max = await this.rdeRepo
        .createQueryBuilder('e')
        .select('COALESCE(MAX(e.order_index), -1)', 'm')
        .where('e.gym_id = :g AND e.day_id = :d', { g: dto.gymId, d: dto.dayId })
        .getRawOne<{ m: string }>();
      orderIndex = Number(max?.m ?? -1) + 1;
    }

    const row = this.rdeRepo.create({
      gymId: dto.gymId,
      routineId: day.routineId,
      dayId: dto.dayId,
      exerciseId: dto.exerciseId,
      orderIndex,
      sets: dto.sets ?? 3,
      reps: dto.reps ?? 10,
      restSeconds: dto.restSeconds ?? 60,
      notes: dto.notes ?? null,
    });
    return this.rdeRepo.save(row);
  }

  async reorderDayExercises(dayId: string, gymId: string, dto: ReorderDayExercisesDto) {
    await this.getDayOrThrow(dayId, gymId);

    // verificamos que todos pertenezcan al día y gym
    const list = await this.rdeRepo.findByIds(dto.orderedIds);
    if (list.length !== dto.orderedIds.length) {
      throw new BadRequestException('IDs inválidos en el ordenamiento');
    }
    for (const e of list) {
      if (e.gymId !== gymId || e.dayId !== dayId) {
        throw new BadRequestException('Un elemento no pertenece a este día/gimnasio');
      }
    }
    // aplicamos orden
    const map = new Map(dto.orderedIds.map((id, idx) => [id, idx]));
    for (const e of list) {
      e.orderIndex = map.get(e.id)!;
    }
    await this.rdeRepo.save(list);
    return { ok: true };
  }

  // ---- assignments ----
  private async buildSnapshot(routineId: string, gymId: string) {
    const days = await this.dayRepo.find({
      where: { gymId, routineId },
      order: { dayIndex: 'ASC' },
    });
    const rdes = await this.rdeRepo.find({
      where: { gymId, routineId },
      order: { orderIndex: 'ASC' },
    });

    const byDay: Record<string, any[]> = {};
    for (const e of rdes) {
      if (!byDay[e.dayId]) byDay[e.dayId] = [];
      byDay[e.dayId].push({
        rdeId: e.id,
        exerciseId: e.exerciseId,
        orderIndex: e.orderIndex,
        sets: e.sets,
        reps: e.reps,
        restSeconds: e.restSeconds,
        notes: e.notes,
      });
    }

    return {
      days: days.map((d) => ({
        dayId: d.id,
        dayIndex: d.dayIndex,
        name: d.name,
        exercises: byDay[d.id] ?? [],
      })),
    };
  }

  async assign(dto: AssignRoutineDto) {
    await this.getRoutineOrThrow(dto.routineId, dto.gymId);
    if (!dto.clientIds?.length) throw new BadRequestException('clientIds vacío');

    const snapshot = await this.buildSnapshot(dto.routineId, dto.gymId);

    const rows = dto.clientIds.map((cid) =>
      this.assignRepo.create({
        gymId: dto.gymId,
        routineId: dto.routineId,
        clientId: cid,
        assignedByUserId: dto.assignedByUserId,
        isActive: true,
        exerciseOverrides: null,
        snapshot,
      }),
    );
    return this.assignRepo.save(rows);
  }

  async listAssignments(q: QueryAssignmentsDto) {
    const where: any = { gymId: q.gymId };
    if (q.routineId) where.routineId = q.routineId;
    if (q.clientId) where.clientId = q.clientId;
    if (typeof q.isActive === 'string') where.isActive = q.isActive === 'true';

    const [data, total] = await this.assignRepo.findAndCount({
      where,
      order: { assignedAt: 'DESC' },
      skip: q.offset ?? 0,
      take: q.limit ?? 20,
    });
    return { data, total };
  }

  async getAssignment(id: string, gymId: string) {
    const a = await this.assignRepo.findOne({ where: { id, gymId } });
    if (!a) throw new NotFoundException('Asignación no encontrada');
    return a;
  }

  async setExerciseOverride(dto: UpdateExerciseOverrideDto) {
    const a = await this.getAssignment(dto.assignmentId, dto.gymId);
    const overrides = { ...(a.exerciseOverrides ?? {}) };
    overrides[dto.rdeId] = dto.override; // guarda por rdeId
    a.exerciseOverrides = overrides;
    return this.assignRepo.save(a);
  }

  async deactivateAssignment(id: string, gymId: string) {
    const a = await this.getAssignment(id, gymId);
    if (!a.isActive) return a;
    a.isActive = false;
    return this.assignRepo.save(a);
  }

  async activateAssignment(id: string, gymId: string) {
    const a = await this.getAssignment(id, gymId);
    if (a.isActive) return a;
    a.isActive = true;
    return this.assignRepo.save(a);
  }
}
