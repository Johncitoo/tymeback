import {
  BadRequestException, ForbiddenException, Injectable, NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Not, Repository } from 'typeorm';
import {
  Appointment, AppointmentStatusEnum, AppointmentTypeEnum,
} from './entities/appointment.entity';
import { StaffAvailability } from './entities/staff-availability.entity';
import { StaffTimeOff } from './entities/staff-time-off.entity';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { QueryAppointmentsDto } from './dto/query-appointments.dto';
import { RescheduleAppointmentDto } from './dto/reschedule-appointment.dto';
import { CancelAppointmentDto } from './dto/cancel-appointment.dto';
import { CompleteAppointmentDto } from './dto/complete-appointment.dto';
import { SetNoShowDto } from './dto/set-no-show.dto';
import { User, RoleEnum } from '../users/entities/user.entity';
import { MembershipsService } from '../memberships/memberships.service';
import { Membership } from '../memberships/entities/membership.entity';
import { GymHour } from '../gym-hours/entities/gym-hour.entity';
import { GymHourOverride } from '../gym-hours/entities/gym-hour-override.entity';

const TZ = 'America/Santiago';

@Injectable()
export class AppointmentsService {
  constructor(
    @InjectRepository(Appointment) private readonly repo: Repository<Appointment>,
    @InjectRepository(StaffAvailability) private readonly availRepo: Repository<StaffAvailability>,
    @InjectRepository(StaffTimeOff) private readonly offRepo: Repository<StaffTimeOff>,
    @InjectRepository(User) private readonly usersRepo: Repository<User>,
    @InjectRepository(Membership) private readonly memRepo: Repository<Membership>,
    @InjectRepository(GymHour) private readonly hoursRepo: Repository<GymHour>,
    @InjectRepository(GymHourOverride) private readonly ovRepo: Repository<GymHourOverride>,
    private readonly membershipsService: MembershipsService,
  ) {}

  private now(): Date { return new Date(); }

  private isoLocalDate(d: Date): string {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit',
    }).formatToParts(d);
    const y = parts.find(p => p.type === 'year')?.value ?? '1970';
    const m = parts.find(p => p.type === 'month')?.value ?? '01';
    const day = parts.find(p => p.type === 'day')?.value ?? '01';
    return `${y}-${m}-${day}`;
  }

  /** 0=Lun..6=Dom (StaffAvailability usa 0..6) */
  private getDayInTZ(d: Date): number {
    const parts = new Intl.DateTimeFormat('en-CA', { timeZone: TZ, weekday: 'short' }).formatToParts(d);
    const wk = parts.find(p => p.type === 'weekday')?.value?.toLowerCase() ?? 'mon';
    const map: Record<string, number> = { mon:0, tue:1, wed:2, thu:3, fri:4, sat:5, sun:6 };
    return map[wk.slice(0,3)] ?? 0;
  }

  /** 0=Dom..6=Sáb (GymHour usa 0..6) */
  private weekdayChile_0to6(isoDate: string): number {
    const d = new Date(`${isoDate}T00:00:00Z`);
    const wk = new Intl.DateTimeFormat('en-CA', { timeZone: TZ, weekday: 'short' })
      .format(d).toLowerCase().slice(0, 3);
    const map: Record<string, number> = { sun:0, mon:1, tue:2, wed:3, thu:4, fri:5, sat:6 };
    return map[wk] ?? 0;
  }

  /** Acepta HH:mm o HH:mm:ss */
  private dateAtLocalTime(yyyyMmDd: string, hhmm: string): Date {
    const [hStr, mStr, sStr] = hhmm.split(':');
    const h = Number(hStr ?? '0');
    const m = Number(mStr ?? '0');
    const s = Number((sStr ?? '0').split('.')[0]);
    const [Y, M, D] = yyyyMmDd.split('-').map(Number);
    const utcGuess = new Date(Date.UTC(Y, M - 1, D, h, m, s));
    const tzLocal = new Date(utcGuess.toLocaleString('en-US', { timeZone: TZ }));
    const offsetMin = (utcGuess.getTime() - tzLocal.getTime()) / 60000;
    return new Date(utcGuess.getTime() + offsetMin * 60000);
  }

  // ---- VALIDACIONES ----
  private async assertUsersRoles(gymId: string, clientId: string, staffId: string, type: AppointmentTypeEnum) {
    const client = await this.usersRepo.findOne({ where: { id: clientId, gymId } });
    if (!client) throw new NotFoundException('Cliente no pertenece al gimnasio');
    if (client.role !== RoleEnum.CLIENT) throw new BadRequestException('clientId no corresponde a un CLIENT');

    const staff = await this.usersRepo.findOne({ where: { id: staffId, gymId } });
    if (!staff) throw new NotFoundException('Staff no pertenece al gimnasio');

    if (type === AppointmentTypeEnum.TRAINING && staff.role !== RoleEnum.TRAINER) {
      throw new BadRequestException('Para TRAINING el staff debe ser TRAINER');
    }
    if (type === AppointmentTypeEnum.NUTRITION && staff.role !== RoleEnum.NUTRITIONIST) {
      throw new BadRequestException('Para NUTRITION el staff debe ser NUTRITIONIST');
    }
    if (type === AppointmentTypeEnum.OTHER && staff.role === RoleEnum.CLIENT) {
      throw new BadRequestException('Staff inválido para OTHER');
    }
    return { client, staff };
  }

  private async assertGymOpen(gymId: string, start: Date, end: Date) {
    const localDay = this.isoLocalDate(start);

    // 1) override del día
    const ov = await this.ovRepo.findOne({ where: { gymId, date: localDay } });
    if (ov) {
      if (!ov.isOpen) throw new BadRequestException('El gimnasio está cerrado ese día');
      if (ov.openTime && ov.closeTime) {
        const o = this.dateAtLocalTime(localDay, ov.openTime);
        const c = this.dateAtLocalTime(localDay, ov.closeTime);
        if (!(start.getTime() >= o.getTime() && end.getTime() <= c.getTime())) {
          throw new BadRequestException('Cita fuera del horario excepcional del gimnasio');
        }
        return;
      }
      // si override sin horas, consideramos cerrado
      throw new BadRequestException('El gimnasio está cerrado ese día');
    }

    // 2) horario semanal (dayOfWeek 0..6)
    const dayOfWeek = this.weekdayChile_0to6(localDay);
    const wh = await this.hoursRepo.findOne({ where: { gymId, dayOfWeek } });
    if (!wh || !wh.isOpen || !wh.openTime || !wh.closeTime) {
      throw new BadRequestException('El gimnasio no abre en ese horario');
    }
    const o = this.dateAtLocalTime(localDay, wh.openTime);
    const c = this.dateAtLocalTime(localDay, wh.closeTime);
    if (!(start.getTime() >= o.getTime() && end.getTime() <= c.getTime())) {
      throw new BadRequestException('Cita fuera del horario del gimnasio');
    }
  }

  private async assertStaffAvailable(gymId: string, staffId: string, start: Date, end: Date) {
    const localDay = this.isoLocalDate(start);
    // ausencias del staff
    const offs = await this.offRepo.find({ where: { gymId, staffId, date: localDay } });
    for (const off of offs) {
      if (!off.startTime && !off.endTime) {
        throw new BadRequestException('Staff no disponible ese día');
      }
      const s = this.dateAtLocalTime(localDay, off.startTime!);
      const e = this.dateAtLocalTime(localDay, off.endTime!);
      if (start < e && end > s) {
        throw new BadRequestException('Staff en tiempo de descanso/permiso');
      }
    }
    // disponibilidad semanal 0..6 (si existe, restringe)
    const dow = this.getDayInTZ(start);
    const windows = await this.availRepo.find({ where: { gymId, staffId, weekday: dow, isAvailable: true } });
    if (!windows.length) return;
    const fitsAny = windows.some(w => {
      const s = this.dateAtLocalTime(localDay, w.startTime);
      const e = this.dateAtLocalTime(localDay, w.endTime);
      return start.getTime() >= s.getTime() && end.getTime() <= e.getTime();
    });
    if (!fitsAny) throw new BadRequestException('Fuera de la disponibilidad del staff');
  }

  private async assertNoConflicts(gymId: string, staffId: string, clientId: string, start: Date, end: Date, excludeId?: string) {
    const whereBase = { gymId, status: Not(AppointmentStatusEnum.CANCELED) } as any;

    const around = {
      from: new Date(start.getTime() - 60 * 60 * 1000),
      to:   new Date(end.getTime()   + 60 * 60 * 1000),
    };

    const conflicts = await this.repo.find({
      where: [
        { ...whereBase, staffId, startAt: Between(around.from, around.to) },
        { ...whereBase, clientId, startAt: Between(around.from, around.to) },
      ],
    });

    const hasOverlap = conflicts.some(c => {
      if (excludeId && c.id === excludeId) return false;
      return start < c.endAt && end > c.startAt;
    });
    if (hasOverlap) throw new BadRequestException('Conflicto de agenda (cliente o staff ya tiene una cita)');
  }

  private parseWindow(startIso: string, endIso: string) {
    const start = new Date(startIso);
    const end = new Date(endIso);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      throw new BadRequestException('Fechas inválidas');
    }
    if (!(end.getTime() > start.getTime())) {
      throw new BadRequestException('endAt debe ser mayor que startAt');
    }
    return { start, end };
  }

  // ---- CRUD ----
  async create(dto: CreateAppointmentDto) {
    const { start, end } = this.parseWindow(dto.startAt, dto.endAt);
    await this.assertUsersRoles(dto.gymId, dto.clientId, dto.staffId, dto.type);
    await this.assertGymOpen(dto.gymId, start, end);
    await this.assertStaffAvailable(dto.gymId, dto.staffId, start, end);
    await this.assertNoConflicts(dto.gymId, dto.staffId, dto.clientId, start, end);

    let membershipId: string | null = null;
    if (dto.membershipId) {
      const m = await this.memRepo.findOne({ where: { id: dto.membershipId, gymId: dto.gymId, clientId: dto.clientId } });
      if (!m) throw new BadRequestException('membershipId inválido');
      membershipId = m.id;
    }

    const row = this.repo.create({
      gymId: dto.gymId,
      type: dto.type,
      clientId: dto.clientId,
      staffId: dto.staffId,
      startAt: start,
      endAt: end,
      status: AppointmentStatusEnum.BOOKED,
      requiresSession: !!dto.requiresSession,
      membershipId,
      createdByUserId: dto.createdByUserId,
      canceledByUserId: null,
      cancelReason: null,
      rescheduledFromId: null,
      notes: dto.notes ?? null,
    });
    return this.repo.save(row);
  }

  async findAll(q: QueryAppointmentsDto) {
    const where: any = { gymId: q.gymId };
    if (q.staffId) where.staffId = q.staffId;
    if (q.clientId) where.clientId = q.clientId;
    if (q.status) where.status = q.status;
    if (q.type) where.type = q.type;

    const hasRange = q.dateFrom && q.dateTo;
    const [data, total] = await this.repo.findAndCount({
      where: hasRange
        ? { ...where, startAt: Between(new Date(q.dateFrom!), new Date(q.dateTo!)) }
        : where,
      order: { startAt: 'DESC' },
      skip: q.offset ?? 0,
      take: q.limit ?? 20,
    });
    return { data, total };
  }

  async findOne(id: string, gymId: string) {
    const row = await this.repo.findOne({ where: { id, gymId } });
    if (!row) throw new NotFoundException('Cita no encontrada');
    return row;
  }

  async reschedule(id: string, dto: RescheduleAppointmentDto) {
    const ap = await this.repo.findOne({ where: { id, gymId: dto.gymId } });
    if (!ap) throw new NotFoundException('Cita no encontrada');
    if ([AppointmentStatusEnum.CANCELED, AppointmentStatusEnum.COMPLETED, AppointmentStatusEnum.NO_SHOW].includes(ap.status)) {
      throw new BadRequestException('No se puede reprogramar una cita finalizada/cancelada');
    }

    const { start, end } = this.parseWindow(dto.newStartAt, dto.newEndAt);
    await this.assertUsersRoles(dto.gymId, ap.clientId, ap.staffId, ap.type);
    await this.assertGymOpen(dto.gymId, start, end);
    await this.assertStaffAvailable(dto.gymId, ap.staffId, start, end);
    await this.assertNoConflicts(dto.gymId, ap.staffId, ap.clientId, start, end, ap.id);

    ap.rescheduledFromId = ap.rescheduledFromId ?? ap.id;
    ap.startAt = start;
    ap.endAt = end;
    ap.status = AppointmentStatusEnum.CONFIRMED;
    ap.notes = dto.reason ? `${ap.notes ?? ''}\nRESCHEDULE: ${dto.reason}`.trim() : ap.notes;
    return this.repo.save(ap);
  }

  async cancel(id: string, dto: CancelAppointmentDto) {
    const ap = await this.repo.findOne({ where: { id, gymId: dto.gymId } });
    if (!ap) throw new NotFoundException('Cita no encontrada');
    if (ap.status === AppointmentStatusEnum.CANCELED) return ap;
    ap.status = AppointmentStatusEnum.CANCELED;
    ap.canceledByUserId = dto.byUserId;
    ap.cancelReason = dto.reason ?? null;
    return this.repo.save(ap);
  }

  async complete(id: string, dto: CompleteAppointmentDto) {
    const ap = await this.repo.findOne({ where: { id, gymId: dto.gymId } });
    if (!ap) throw new NotFoundException('Cita no encontrada');
    if ([AppointmentStatusEnum.CANCELED, AppointmentStatusEnum.COMPLETED].includes(ap.status)) {
      return ap;
    }
    ap.status = AppointmentStatusEnum.COMPLETED;

    // Consumo de sesión si corresponde
    if (ap.requiresSession) {
      let membershipId = dto.membershipId ?? ap.membershipId ?? null;
      if (!membershipId) {
        const active = await this.membershipsService.getActiveForClient(ap.clientId, ap.gymId);
        if (!active) throw new ForbiddenException('No hay membresía activa para consumir');
        membershipId = active.id;
        ap.membershipId = active.id;
      }
      await this.membershipsService.useSessions(membershipId, {
        gymId: dto.gymId,
        count: 1,
        note: dto.note ?? `Appointment ${ap.id}`,
      });
    }

    return this.repo.save(ap);
  }

  async setNoShow(id: string, dto: SetNoShowDto) {
    const ap = await this.repo.findOne({ where: { id, gymId: dto.gymId } });
    if (!ap) throw new NotFoundException('Cita no encontrada');
    if ([AppointmentStatusEnum.CANCELED, AppointmentStatusEnum.COMPLETED].includes(ap.status)) {
      throw new BadRequestException('No-show no aplica a cita finalizada/cancelada');
    }
    ap.status = AppointmentStatusEnum.NO_SHOW;
    ap.notes = dto.note ? `${ap.notes ?? ''}\nNO_SHOW: ${dto.note}`.trim() : ap.notes;
    return this.repo.save(ap);
  }
}
