import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, LessThanOrEqual, MoreThanOrEqual, Repository } from 'typeorm';
import { GymHour } from './entities/gym-hour.entity';
import { GymHourOverride } from './entities/gym-hour-override.entity';
import { UpsertHourDto } from './dto/upsert-hour.dto';
import { BulkUpsertHoursDto } from './dto/bulk-upsert-hours.dto';
import { CreateOverrideDto } from './dto/create-override.dto';
import { QueryHoursDto } from './dto/query-hours.dto';
import { QueryOverridesDto } from './dto/query-overrides.dto';
import { User, RoleEnum } from '../users/entities/user.entity';
import { GymUser } from '../gym-users/entities/gym-user.entity';

const TZ = 'America/Santiago';
const HHMM = /^\d{2}:\d{2}$/;

@Injectable()
export class GymHoursService {
  constructor(
    @InjectRepository(GymHour)
    private readonly hoursRepo: Repository<GymHour>,
    @InjectRepository(GymHourOverride)
    private readonly ovRepo: Repository<GymHourOverride>,
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
    @InjectRepository(GymUser)
    private readonly gymUsersRepo: Repository<GymUser>,
  ) {}

  // ---------------- helpers ----------------
  private async assertAdmin(userId: string, gymId: string) {
    const gymUser = await this.gymUsersRepo.findOne({ where: { userId, gymId } });
    if (!gymUser) throw new NotFoundException('Usuario no pertenece al gimnasio');
    
    const u = await this.usersRepo.findOne({ where: { id: userId } });
    if (!u) throw new NotFoundException('Usuario no encontrado');
    
    if (gymUser.role !== RoleEnum.ADMIN) throw new ForbiddenException('Solo ADMIN');
    return { ...u, role: gymUser.role };
  }

  private ensureTimes(isOpen: boolean, openTime?: string | null, closeTime?: string | null) {
    if (!isOpen) return; // cerrado: ignoramos horas
    if (!openTime || !closeTime) {
      throw new BadRequestException('openTime y closeTime son requeridos si isOpen=true');
    }
    if (!HHMM.test(openTime) || !HHMM.test(closeTime)) {
      throw new BadRequestException('Formato de hora inválido. Use "HH:mm".');
    }
    if (openTime >= closeTime) {
      throw new BadRequestException('openTime debe ser menor que closeTime');
    }
  }

  /** Devuelve 0..6 (0=Dom..6=Sáb) en zona horaria Chile para YYYY-MM-DD */
  private weekdayChile_0to6(isoDate: string): number {
    const d = new Date(`${isoDate}T00:00:00`);
    const wk = new Intl.DateTimeFormat('en-CA', { timeZone: TZ, weekday: 'short' })
      .format(d)
      .toLowerCase()
      .slice(0, 3);
    const map: Record<string, number> = { sun:0, mon:1, tue:2, wed:3, thu:4, fri:5, sat:6 };
    return map[wk] ?? 0;
  }

  // ---------------- UPSERT (single) ----------------
  async upsertHour(dto: UpsertHourDto) {
    await this.assertAdmin(dto.byUserId, dto.gymId);
    const isOpen = !dto.isClosed; // Convertir isClosed (del DTO) a isOpen (de la BD)
    this.ensureTimes(isOpen, dto.openTime ?? null, dto.closeTime ?? null);

    let row = await this.hoursRepo.findOne({
      where: { gymId: dto.gymId, dayOfWeek: dto.weekday }, // 0=Dom..6=Sáb
    });

    if (!row) {
      row = this.hoursRepo.create({
        gymId: dto.gymId,
        dayOfWeek: dto.weekday,
        isOpen,
        openTime: isOpen ? dto.openTime! : null,
        closeTime: isOpen ? dto.closeTime! : null,
      });
    } else {
      row.isOpen = isOpen;
      row.openTime = isOpen ? dto.openTime! : null;
      row.closeTime = isOpen ? dto.closeTime! : null;
    }

    return this.hoursRepo.save(row);
  }

  // ---------------- UPSERT (bulk) ----------------
  async bulkUpsert(dto: BulkUpsertHoursDto) {
    if (!dto.items?.length) return { updated: 0, items: [] };

    const gymId = dto.items[0].gymId;
    const byUserId = dto.items[0].byUserId;
    await this.assertAdmin(byUserId, gymId);

    for (const it of dto.items) {
      if (it.gymId !== gymId) {
        throw new BadRequestException('Todos los items deben pertenecer al mismo gymId');
      }
      const isOpen = !it.isClosed;
      this.ensureTimes(isOpen, it.openTime ?? null, it.closeTime ?? null);
    }

    const upserts: GymHour[] = [];

    for (const it of dto.items) {
      const isOpen = !it.isClosed;
      let row = await this.hoursRepo.findOne({ where: { gymId, dayOfWeek: it.weekday } });
      if (!row) {
        row = this.hoursRepo.create({
          gymId,
          dayOfWeek: it.weekday,
          isOpen,
          openTime: isOpen ? it.openTime! : null,
          closeTime: isOpen ? it.closeTime! : null,
        });
      } else {
        row.isOpen = isOpen;
        row.openTime = isOpen ? it.openTime! : null;
        row.closeTime = isOpen ? it.closeTime! : null;
      }
      upserts.push(row);
    }

    const saved = await this.hoursRepo.save(upserts);
    return { updated: saved.length, items: saved };
  }

  // ---------------- LIST weekly ----------------
  async listWeekly(gymId: string) {
    const rows = await this.hoursRepo.find({
      where: { gymId },
      order: { dayOfWeek: 'ASC' },
    });
    return rows;
  }

  // ---------------- OVERRIDES ----------------
  async createOverride(dto: CreateOverrideDto) {
    await this.assertAdmin(dto.byUserId, dto.gymId);
    const isOpen = !dto.isClosed;
    this.ensureTimes(isOpen, dto.openTime ?? null, dto.closeTime ?? null);

    let row = await this.ovRepo.findOne({ where: { gymId: dto.gymId, date: dto.date } });
    if (!row) {
      row = this.ovRepo.create({
        gymId: dto.gymId,
        date: dto.date,            // YYYY-MM-DD
        isOpen,
        openTime: isOpen ? (dto.openTime ?? null) : null,
        closeTime: isOpen ? (dto.closeTime ?? null) : null,
        note: dto.reason ?? null,
      });
    } else {
      row.isOpen = isOpen;
      row.openTime = isOpen ? (dto.openTime ?? null) : null;
      row.closeTime = isOpen ? (dto.closeTime ?? null) : null;
      row.note = dto.reason ?? row.note ?? null;
    }
    return this.ovRepo.save(row);
  }

  async listOverrides(q: QueryOverridesDto) {
    const where: any = { gymId: q.gymId };
    if (q.dateFrom && q.dateTo) {
      where.date = Between(q.dateFrom, q.dateTo);
    } else if (q.dateFrom) {
      where.date = MoreThanOrEqual(q.dateFrom);
    } else if (q.dateTo) {
      where.date = LessThanOrEqual(q.dateTo);
    }

    const [data, total] = await this.ovRepo.findAndCount({
      where,
      order: { date: 'ASC' },
      skip: q.offset ?? 0,
      take: q.limit ?? 50,
    });
    return { data, total };
  }

  async removeOverride(id: string, gymId: string, byUserId: string) {
    await this.assertAdmin(byUserId, gymId);
    const row = await this.ovRepo.findOne({ where: { id, gymId } });
    if (!row) throw new NotFoundException('Override no encontrado');
    await this.ovRepo.remove(row);
    return { ok: true };
  }

  // ---------------- RESOLVE ----------------
  /** Devuelve el horario efectivo para una fecha: override si existe; si no, semanal (1=Lun..7=Dom). */
  async resolve(q: QueryHoursDto) {
    const gymId = q.gymId;
    const dateStr = q.date ?? new Date().toISOString().slice(0, 10); // YYYY-MM-DD

    // 1) override?
    const ov = await this.ovRepo.findOne({ where: { gymId, date: dateStr } });
    if (ov) {
      return {
        source: 'override',
        gymId,
        date: dateStr,
        isClosed: !ov.isOpen,
        openTime: ov.openTime,
        closeTime: ov.closeTime,
        reason: ov.note,
      };
    }

    // 2) semanal (dayOfWeek 0..6, zona horaria Chile)
    const dayOfWeek = this.weekdayChile_0to6(dateStr);
    const wh = await this.hoursRepo.findOne({ where: { gymId, dayOfWeek } });
    if (!wh) {
      return {
        source: 'weekly-default',
        gymId,
        date: dateStr,
        isClosed: true,
        openTime: null,
        closeTime: null,
        reason: 'No configurado',
      };
    }

    return {
      source: 'weekly',
      gymId,
      date: dateStr,
      isClosed: !wh.isOpen,
      openTime: wh.openTime,
      closeTime: wh.closeTime,
      reason: null,
    };
  }
}
