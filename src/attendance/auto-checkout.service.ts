// src/attendance/auto-checkout.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull, In } from 'typeorm';
import { Attendance, CheckoutReasonEnum } from './entities/attendance.entity';
import { GymHour } from '../gym-hours/entities/gym-hour.entity';
import { GymHourOverride } from '../gym-hours/entities/gym-hour-override.entity';

const TZ = 'America/Santiago';
const TWO_HOURS_MS = 2 * 60 * 60 * 1000;

@Injectable()
export class AutoCheckoutService {
  private readonly logger = new Logger(AutoCheckoutService.name);

  constructor(
    @InjectRepository(Attendance)
    private readonly attRepo: Repository<Attendance>,
    @InjectRepository(GymHour)
    private readonly hoursRepo: Repository<GymHour>,
    @InjectRepository(GymHourOverride)
    private readonly ovRepo: Repository<GymHourOverride>,
  ) {}

  @Cron('*/5 * * * *', { timeZone: TZ })
  async run() {
    // Hasta 500 sesiones abiertas por corrida
    const open = await this.attRepo.find({
      where: { checkOutAt: IsNull() },
      order: { checkInAt: 'ASC' },
      take: 500,
    });
    if (open.length === 0) return;

    // TODO: Restaurar lógica de cierre por gym cuando attendance tenga gymId
    // Por ahora solo cerramos por regla de 2 horas
    const now = new Date();
    let updated = 0;
    for (const row of open) {
      const twoHours = new Date(row.checkInAt.getTime() + TWO_HOURS_MS);
      if (now.getTime() >= twoHours.getTime()) {
        row.checkOutAt = now;
        row.checkoutReason = CheckoutReasonEnum.AUTO_TIMEOUT;
        await this.attRepo.save(row);
        updated++;
      }
    }

    if (updated > 0) {
      this.logger.log(`Auto-checkout: ${updated} asistencias cerradas`);
    }
  }

  // ---------- Helpers de normalización ----------

  // Devuelve YYYY-MM-DD en TZ Chile
  private isoLocalDate(d: Date): string {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: TZ,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(d);
    const y = parts.find((p) => p.type === 'year')?.value ?? '1970';
    const m = parts.find((p) => p.type === 'month')?.value ?? '01';
    const day = parts.find((p) => p.type === 'day')?.value ?? '01';
    return `${y}-${m}-${day}`;
  }

  // 0(dom)–6(sáb) en TZ Chile
  private getDayInTZ(d: Date): number {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: TZ,
      weekday: 'short',
    }).formatToParts(d);
    const wk = parts.find((p) => p.type === 'weekday')?.value?.toLowerCase() ?? 'sun';
    const map: Record<string, number> = {
      sun: 0,
      mon: 1,
      tue: 2,
      wed: 3,
      thu: 4,
      fri: 5,
      sat: 6,
    };
    return map[wk.slice(0, 3)] ?? 0;
  }

  // Convierte YYYY-MM-DD + "HH:mm" (hora local Chile) → Date (instante UTC real)
  private dateAtLocalTime(yyyyMmDd: string, hhmm: string): Date {
    const [h, m] = hhmm.split(':').map(Number);
    const [Y, M, D] = yyyyMmDd.split('-').map(Number);
    const utcGuess = new Date(Date.UTC(Y, M - 1, D, h, m, 0));
    const tzLocal = new Date(utcGuess.toLocaleString('en-US', { timeZone: TZ }));
    const offsetMin = (utcGuess.getTime() - tzLocal.getTime()) / 60000;
    return new Date(utcGuess.getTime() + offsetMin * 60000);
  }

  /** Normalizadores tolerantes a distintos nombres de columnas/campos */

  // isOpen: isOpen | open | is_open | (default=true si no existe)
  private ghIsOpen(gh: any): boolean {
    const v = gh?.isOpen ?? gh?.open ?? gh?.is_open;
    return typeof v === 'boolean' ? v : true;
  }

  // dayOfWeek: dayOfWeek | day_of_week | dow
  private ghDayOfWeek(gh: any): number | null {
    const v = gh?.dayOfWeek ?? gh?.day_of_week ?? gh?.dow;
    return typeof v === 'number' ? v : v != null ? Number(v) : null;
  }

  // closeTime: closeTime | close_time
  private ghCloseTime(gh: any): string | null {
    return gh?.closeTime ?? gh?.close_time ?? null;
  }

  // openTime: openTime | open_time (por si quisieras usarlo más adelante)
  private ghOpenTime(gh: any): string | null {
    return gh?.openTime ?? gh?.open_time ?? null;
  }

  // override.isOpen: isOpen | open | is_open
  private ovIsOpen(ov: any): boolean {
    const v = ov?.isOpen ?? ov?.open ?? ov?.is_open;
    return typeof v === 'boolean' ? v : true;
  }

  private ovCloseTime(ov: any): string | null {
    return ov?.closeTime ?? ov?.close_time ?? null;
  }

  // ---------- Lógica de cutoff (2h vs hora de cierre) ----------
  // TODO: Restaurar cuando attendance tenga gymId para filtrar por gym
  /*
  private computeCutoff(
    row: Attendance,
    weekly: any[], // tolerante a tipos
    ovMap: Map<string, any>,
  ): Date | null {
    const checkIn = row.checkInAt;
    const localDay = this.isoLocalDate(checkIn);

    // Regla 1: 2 horas desde el check-in
    const twoHours = new Date(checkIn.getTime() + TWO_HOURS_MS);

    // Regla 2: hora de cierre (override > weekly > fallback 21:00)
    let close: Date | null = null;

    const ov = ovMap.get(`${row.gymId}|${localDay}`);
    if (ov) {
      if (this.ovIsOpen(ov) && this.ovCloseTime(ov)) {
        close = this.dateAtLocalTime(localDay, this.ovCloseTime(ov)!);
      } else {
        // cerrado => cierre a 00:00 para efecto de auto-checkout
        close = this.dateAtLocalTime(localDay, '00:00');
      }
    } else {
      const dow = this.getDayInTZ(checkIn);
      // Encontrar entrada weekly para ese DOW
      const wh = weekly.find((x) => this.ghDayOfWeek(x) === dow);
      if (wh && this.ghIsOpen(wh) && this.ghCloseTime(wh)) {
        close = this.dateAtLocalTime(localDay, this.ghCloseTime(wh)!);
      } else if (wh && !this.ghIsOpen(wh)) {
        close = this.dateAtLocalTime(localDay, '00:00');
      } else {
        // Fallback si no hay configuración: 21:00
        close = this.dateAtLocalTime(localDay, '21:00');
      }
    }

    // cutoff = el evento que ocurra primero (min(twoHours, close))
    const candidateTimes = [twoHours, close].filter(Boolean) as Date[];
    if (candidateTimes.length === 0) return null;
    candidateTimes.sort((a, b) => a.getTime() - b.getTime());
    return candidateTimes[0];
  }
  */
}
