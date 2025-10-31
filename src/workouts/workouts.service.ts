import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { WorkoutSession } from './entities/workout-session.entity';
import { WorkoutEntry } from './entities/workout-entry.entity';
import { StartSessionDto } from './dto/start-session.dto';
import { ToggleEntryDto } from './dto/toggle-entry.dto';
import { QuerySessionsDto } from './dto/query-sessions.dto';
import { RoutineAssignment } from '../routines/entities/routine-assignment.entity';

@Injectable()
export class WorkoutsService {
  constructor(
    @InjectRepository(WorkoutSession)
    private readonly sessionRepo: Repository<WorkoutSession>,
    @InjectRepository(WorkoutEntry)
    private readonly entryRepo: Repository<WorkoutEntry>,
    @InjectRepository(RoutineAssignment)
    private readonly assignRepo: Repository<RoutineAssignment>,
  ) {}

  private now(): Date {
    return new Date();
  }

  /**
   * Devuelve { y, m, d, dow(0..6), yyyyMmDd } en zona America/Santiago
   */
  private chileParts(d = new Date()) {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Santiago',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      weekday: 'short',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }).formatToParts(d);

    const get = (t: string) => parts.find((p) => p.type === t)?.value!;
    const y = Number(get('year'));
    const m = Number(get('month'));
    const day = Number(get('day'));

    // Para dayOfWeek, generamos un Date local y usamos getDay()
    const local = new Date(
      `${get('year')}-${get('month')}-${get('day')}T${get('hour')}:${get('minute')}:${get('second')}-00:00`,
    );
    const dow = local.getDay(); // 0 domingo .. 6 sábado

    const yyyyMmDd = `${y}-${String(m).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return { y, m, d: day, dow, yyyyMmDd };
  }

  /**
   * Fecha (YYYY-MM-DD) del domingo que inicia la semana local Chile
   */
  private weekStartChile(today = new Date()): string {
    const { y, m, d, dow } = this.chileParts(today);
    // resta 'dow' días para llegar al domingo
    const base = new Date(Date.UTC(y, m - 1, d, 0, 0, 0));
    base.setUTCDate(base.getUTCDate() - dow);
    const ys = base.getUTCFullYear();
    const ms = base.getUTCMonth() + 1;
    const ds = base.getUTCDate();
    return `${ys}-${String(ms).padStart(2, '0')}-${String(ds).padStart(2, '0')}`;
    // Nota: esto produce el domingo 00:00 equivalente; el límite real de UI se maneja por "semana" lógica.
  }

  private async getAssignmentOrThrow(id: string, gymId: string, clientId: string) {
    const a = await this.assignRepo.findOne({ where: { id, gymId, clientId, isActive: true } });
    if (!a) throw new NotFoundException('Asignación no encontrada o inactiva');
    if (!a.snapshot || !Array.isArray(a.snapshot?.days)) {
      throw new BadRequestException('Asignación sin snapshot válido');
    }
    return a;
  }

  // --------- Sesiones ---------
  /**
   * Crea (o devuelve) la sesión semanal para (assignmentId, dayIndex) y crea entradas
   * para cada ejercicio del snapshot del día.
   */
  async startSession(dto: StartSessionDto) {
    if (dto.dayIndex < 1 || dto.dayIndex > 7) {
      throw new BadRequestException('dayIndex debe estar en 1..7');
    }

    const a = await this.getAssignmentOrThrow(dto.assignmentId, dto.gymId, dto.clientId);

    const weekStart = this.weekStartChile();
    let session = await this.sessionRepo.findOne({
      where: {
        gymId: dto.gymId,
        assignmentId: dto.assignmentId,
        weekStart,
        dayIndex: dto.dayIndex,
      },
    });

    if (!session) {
      session = this.sessionRepo.create({
        gymId: dto.gymId,
        assignmentId: dto.assignmentId,
        clientId: dto.clientId,
        weekStart,
        dayIndex: dto.dayIndex,
      });
      session = await this.sessionRepo.save(session);
    }

    // Construir entradas según snapshot del día
    const day = a.snapshot.days.find((d: any) => d.dayIndex === dto.dayIndex);
    if (!day) {
      // Permite días sin ejercicios, pero devuelve sesión vacía
      return { session, entries: [] };
    }

    const rdeIds = day.exercises.map((e: any) => e.rdeId);
    const existing = rdeIds.length
      ? await this.entryRepo.find({
          where: { gymId: dto.gymId, sessionId: session.id, rdeId: In(rdeIds) },
        })
      : [];

    const existingSet = new Set(existing.map((e) => e.rdeId));

    const toCreate = day.exercises
      .filter((e: any) => !existingSet.has(e.rdeId))
      .map((e: any) =>
        this.entryRepo.create({
          gymId: dto.gymId,
          sessionId: session.id,
          rdeId: e.rdeId,
          done: false,
          completedAt: null,
          actual: null,
          notes: null,
        }),
      );

    if (toCreate.length) {
      await this.entryRepo.save(toCreate);
    }

    const entries = await this.entryRepo.find({
      where: { gymId: dto.gymId, sessionId: session.id },
      order: { completedAt: 'ASC' }, // los "no hechos" quedan primero (completedAt null)
    });

    return { session, entries };
  }

  async getSession(sessionId: string, gymId: string) {
    const s = await this.sessionRepo.findOne({ where: { id: sessionId, gymId } });
    if (!s) throw new NotFoundException('Sesión no encontrada');
    const entries = await this.entryRepo.find({
      where: { gymId, sessionId },
      order: { completedAt: 'ASC' },
    });
    return { session: s, entries };
  }

  async listSessions(q: QuerySessionsDto) {
    const weekStart = q.weekStart ?? this.weekStartChile();
    const where: any = { gymId: q.gymId, clientId: q.clientId, weekStart };
    if (q.dayIndex) where.dayIndex = q.dayIndex;

    const [data, total] = await this.sessionRepo.findAndCount({
      where,
      order: { startedAt: 'DESC' },
      skip: q.offset ?? 0,
      take: q.limit ?? 20,
    });
    return { data, total };
  }

  // --------- Entradas ---------
  async toggleEntry(dto: ToggleEntryDto) {
    const s = await this.sessionRepo.findOne({
      where: { id: dto.sessionId, gymId: dto.gymId },
    });
    if (!s) throw new NotFoundException('Sesión no encontrada');

    let e = await this.entryRepo.findOne({
      where: { gymId: dto.gymId, sessionId: dto.sessionId, rdeId: dto.rdeId },
    });
    if (!e) {
      // Si por algún motivo no existe (p.ej. fue añadido luego de iniciar), créalo vacío
      e = this.entryRepo.create({
        gymId: dto.gymId,
        sessionId: dto.sessionId,
        rdeId: dto.rdeId,
        done: false,
        completedAt: null,
        actual: null,
        notes: null,
      });
    }

    e.done = dto.done;
    e.completedAt = dto.done ? this.now() : null;
    if (dto.notes !== undefined) e.notes = dto.notes || null;

    await this.entryRepo.save(e);

    // Devolver orden con "no hechos" primero (el front los puede enviar al final)
    const entries = await this.entryRepo.find({
      where: { gymId: dto.gymId, sessionId: dto.sessionId },
      order: { completedAt: 'ASC' },
    });
    return { session: s, entries };
  }
}
