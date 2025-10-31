import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull, LessThanOrEqual } from 'typeorm';
import { Attendance, CheckoutReasonEnum } from '../attendance/entities/attendance.entity';
import { GymHour } from '../gym-hours/entities/gym-hour.entity';
import { GymHourOverride } from '../gym-hours/entities/gym-hour-override.entity';

const TZ = 'America/Santiago';

@Injectable()
export class OpsService {
  private readonly logger = new Logger(OpsService.name);
  private readonly TWO_HOURS_MS = 2 * 60 * 60 * 1000;

  constructor(
    @InjectRepository(Attendance)
    private readonly attRepo: Repository<Attendance>,
    @InjectRepository(GymHour)
    private readonly hoursRepo: Repository<GymHour>,
    @InjectRepository(GymHourOverride)
    private readonly ovRepo: Repository<GymHourOverride>,
  ) {}

  // ===== helpers TZ/fecha/hora =====
  private isoLocalDate(d: Date): string {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit',
    }).formatToParts(d);
    const y = parts.find(p => p.type === 'year')?.value ?? '1970';
    const m = parts.find(p => p.type === 'month')?.value ?? '01';
    const day = parts.find(p => p.type === 'day')?.value ?? '01';
    return `${y}-${m}-${day}`;
  }

  /** 0=Dom..6=Sáb (coherente con la tabla gym_hours) */
  private weekdayChile_0to6(isoDate: string): number {
    const d = new Date(`${isoDate}T00:00:00Z`);
    const wk = new Intl.DateTimeFormat('en-CA', { timeZone: TZ, weekday: 'short' })
      .format(d).toLowerCase().slice(0, 3);
    const map: Record<string, number> = { sun:0, mon:1, tue:2, wed:3, thu:4, fri:5, sat:6 };
    return map[wk] ?? 0;
  }

  /** Crea un Date en UTC para YYYY-MM-DD + HH:mm[:ss] en TZ Chile */
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

  /** Resuelve cierre del día (override > weekly). Cache simple por corrida. */
  private closeInfoCache = new Map<string, { isOpen: boolean; closeTime: string | null }>();

  private async resolveClosingInfo(gymId: string, localDate: string) {
    const key = `${gymId}:${localDate}`;
    const cached = this.closeInfoCache.get(key);
    if (cached) return cached;

    // 1) Override del día
    const ov = await this.ovRepo.findOne({ where: { gymId, date: localDate } });
    if (ov) {
      const out = { isOpen: ov.isOpen, closeTime: ov.closeTime ?? null };
      this.closeInfoCache.set(key, out);
      return out;
    }

    // 2) Semanal (dayOfWeek 0..6)
    const dayOfWeek = this.weekdayChile_0to6(localDate);
    const wh = await this.hoursRepo.findOne({
      where: { gymId, dayOfWeek },
      select: { isOpen: true, closeTime: true },
    });

    const out = wh
      ? { isOpen: wh.isOpen, closeTime: wh.closeTime ?? null }
      : { isOpen: false, closeTime: null };

    this.closeInfoCache.set(key, out);
    return out;
  }

  // ===== CRON 1: cierre por TIMEOUT (2h) =====
  @Cron('*/10 * * * *', { timeZone: TZ })
  async autoCheckoutByTimeout() {
    const now = new Date();
    const cutoff = new Date(now.getTime() - this.TWO_HOURS_MS);

    const stale = await this.attRepo.find({
      where: { checkOutAt: IsNull(), checkInAt: LessThanOrEqual(cutoff) },
      order: { checkInAt: 'ASC' },
    });

    if (!stale.length) return;

    let n = 0;
    for (const row of stale) {
      row.checkOutAt = now;
      row.checkoutReason = CheckoutReasonEnum.AUTO_TIMEOUT;
      row.note = row.note ? `${row.note} | Auto-checkout (2h)` : 'Auto-checkout (2h)';
      try {
        await this.attRepo.save(row);
        n++;
      } catch (e) {
        this.logger.error(`Auto-timeout fallo attendance ${row.id} (gym ${row.gymId}): ${e}`);
      }
    }
    if (n) this.logger.log(`Auto-timeout: cerradas ${n} sesiones (>2h).`);
  }

  // ===== CRON 2: cierre por HORA DE CIERRE (override > weekly) =====
  @Cron('*/5 * * * *', { timeZone: TZ })
  async autoCheckoutByClosingTime() {
    const now = new Date();
    const nowLocalDate = this.isoLocalDate(now);
    this.closeInfoCache.clear();

    const open = await this.attRepo.find({ where: { checkOutAt: IsNull() } });
    if (!open.length) return;

    let closed = 0;

    for (const row of open) {
      try {
        const inLocalDate = this.isoLocalDate(row.checkInAt);

        // Si pasó a un día siguiente, cerrar por fin de día
        if (nowLocalDate > inLocalDate) {
          row.checkOutAt = now;
          row.checkoutReason = CheckoutReasonEnum.AUTO_CLOSING_TIME;
          row.note = row.note ? `${row.note} | Auto-checkout (cierre del día)` : 'Auto-checkout (cierre del día)';
          await this.attRepo.save(row);
          closed++;
          continue;
        }

        // Mismo día: override > weekly
        const closing = await this.resolveClosingInfo(row.gymId, inLocalDate);

        if (!closing.isOpen || !closing.closeTime) {
          row.checkOutAt = now;
          row.checkoutReason = CheckoutReasonEnum.AUTO_CLOSING_TIME;
          row.note = row.note ? `${row.note} | Auto-checkout (día sin apertura)` : 'Auto-checkout (día sin apertura)';
          await this.attRepo.save(row);
          closed++;
          continue;
        }

        const closeAt = this.dateAtLocalTime(inLocalDate, closing.closeTime);
        if (now >= closeAt) {
          row.checkOutAt = now;
          row.checkoutReason = CheckoutReasonEnum.AUTO_CLOSING_TIME;
          row.note = row.note ? `${row.note} | Auto-checkout (cierre gimnasio)` : 'Auto-checkout (cierre gimnasio)';
          await this.attRepo.save(row);
          closed++;
        }
      } catch (e) {
        this.logger.error(`Auto-closing fallo attendance ${row.id} (gym ${row.gymId}): ${e}`);
      }
    }

    if (closed) {
      this.logger.log(`Auto-closing: cerradas ${closed} sesiones por hora de cierre/fin de día.`);
    }
  }
}
