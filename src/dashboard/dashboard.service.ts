import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Repository,
  MoreThanOrEqual,
  LessThanOrEqual,
  LessThan,
  Between,
  IsNull,
} from 'typeorm';
import { Payment } from '../payments/entities/payment.entity';
import { Membership } from '../memberships/entities/membership.entity';
import { Attendance } from '../attendance/entities/attendance.entity';
import { User, RoleEnum } from '../users/entities/user.entity';
import { DashboardSummaryDto } from './dto/dashboard-summary.dto';
import { SalesSeriesDto } from './dto/sales-series.dto';
import { RecentPaymentsDto } from './dto/recent-payments.dto';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Payment) private readonly payRepo: Repository<Payment>,
    @InjectRepository(Membership) private readonly memRepo: Repository<Membership>,
    @InjectRepository(Attendance) private readonly attRepo: Repository<Attendance>,
    @InjectRepository(User) private readonly usersRepo: Repository<User>,
  ) {}

  // ----------------- helpers de fecha -----------------
  private now(): Date {
    return new Date();
  }

  // YYYY-MM a (start, end) UTC con límites [start, end)
  private monthRange(yearMonth?: string) {
    let y: number, m: number;
    if (yearMonth && /^\d{4}-\d{2}$/.test(yearMonth)) {
      y = Number(yearMonth.slice(0, 4));
      m = Number(yearMonth.slice(5, 7)) - 1;
    } else {
      const d = this.now();
      y = d.getFullYear();
      m = d.getMonth();
    }
    const start = new Date(Date.UTC(y, m, 1, 0, 0, 0));
    const end = new Date(Date.UTC(y, m + 1, 1, 0, 0, 0));
    return { start, end, ym: `${y}-${String(m + 1).padStart(2, '0')}` };
  }

  private ymOf(date: Date) {
    return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
  }

  private addMonthsUTC(d: Date, delta: number) {
    return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + delta, 1));
  }

  // ----------------- SUMMARY -----------------
  async summary(dto: DashboardSummaryDto) {
    const { start, end, ym } = this.monthRange(dto.month);

    // ventas mes actual (con/sin IVA)
    const qb = this.payRepo
      .createQueryBuilder('p')
      .select('COALESCE(SUM(p.total_amount_clp), 0)', 'gross')
      .addSelect('COALESCE(SUM(p.net_amount_clp), 0)', 'net')
      .addSelect('COALESCE(SUM(p.vat_amount_clp), 0)', 'vat')
      .where('p.gym_id = :g', { g: dto.gymId })
      .andWhere('p.paid_at >= :start AND p.paid_at < :end', { start, end });

    const row = await qb.getRawOne<{ gross: string; net: string; vat: string }>();
    const monthlyGross = Number(row?.gross ?? 0);
    const monthlyNet = Number(row?.net ?? 0);
    const monthlyVat = Number(row?.vat ?? 0);

    // año actual acumulado
    const y = Number(ym.slice(0, 4));
    const startYear = new Date(Date.UTC(y, 0, 1));
    const endYear = new Date(Date.UTC(y + 1, 0, 1));
    const yb = this.payRepo
      .createQueryBuilder('p')
      .select('COALESCE(SUM(p.total_amount_clp), 0)', 'gross')
      .addSelect('COALESCE(SUM(p.net_amount_clp), 0)', 'net')
      .addSelect('COALESCE(SUM(p.vat_amount_clp), 0)', 'vat')
      .where('p.gym_id = :g', { g: dto.gymId })
      .andWhere('p.paid_at >= :start AND p.paid_at < :end', { start: startYear, end: endYear });
    const yRow = await yb.getRawOne<{ gross: string; net: string; vat: string }>();
    const ytdGross = Number(yRow?.gross ?? 0);
    const ytdNet = Number(yRow?.net ?? 0);
    const ytdVat = Number(yRow?.vat ?? 0);

    // último mes (para comparativa)
    const prevStart = this.addMonthsUTC(start, -1);
    const prevEnd = start;
    const pb = this.payRepo
      .createQueryBuilder('p')
      .select('COALESCE(SUM(p.total_amount_clp), 0)', 'gross')
      .where('p.gym_id = :g', { g: dto.gymId })
      .andWhere('p.paid_at >= :start AND p.paid_at < :end', { start: prevStart, end: prevEnd });
    const pRow = await pb.getRawOne<{ gross: string }>();
    const lastMonthGross = Number(pRow?.gross ?? 0);

    // miembros activos hoy (por fechas)
    const todayISO = this.now().toISOString().slice(0, 10);
    const activeMembers = await this.memRepo.count({
      where: {
        gymId: dto.gymId,
        startDate: LessThanOrEqual(todayISO),
        endDate: MoreThanOrEqual(todayISO),
      },
    });

    // entrenadores activos (is_active = true)
    const activeTrainers = await this.usersRepo.count({
      where: { gymId: dto.gymId, role: RoleEnum.TRAINER, isActive: true },
    });

    // clientes dentro del gimnasio (asistencias abiertas)
    const inside = await this.attRepo.count({
      where: { gymId: dto.gymId, checkOutAt: IsNull() },
    });

    // promedio ingresos por miembro (evitar división por cero)
    const avgRevenuePerActive =
      activeMembers > 0 ? Math.round(monthlyGross / activeMembers) : 0;

    // últimos pagos (tabla)
    const lastPayments = await this.payRepo.find({
      where: { gymId: dto.gymId },
      order: { paidAt: 'DESC' },
      take: 10,
    });

    return {
      month: ym,
      sales: {
        monthly: { grossClp: monthlyGross, netClp: monthlyNet, vatClp: monthlyVat },
        lastMonth: { grossClp: lastMonthGross },
        ytd: { grossClp: ytdGross, netClp: ytdNet, vatClp: ytdVat },
      },
      people: {
        activeMembers,
        activeTrainers,
        inside,
        avgRevenuePerActive,
      },
      lastPayments,
    };
  }

  // ----------------- SERIES POR MES -----------------
  async salesSeries(dto: SalesSeriesDto) {
    const { endMonth } = dto;
    const end = endMonth && /^\d{4}-\d{2}$/.test(endMonth)
      ? new Date(Date.UTC(Number(endMonth.slice(0, 4)), Number(endMonth.slice(5, 7)) - 1, 1))
      : new Date(Date.UTC(this.now().getUTCFullYear(), this.now().getUTCMonth(), 1));

    const points: Array<{ month: string; grossClp: number; netClp: number; vatClp: number }> = [];

    for (let i = dto.months - 1; i >= 0; i--) {
      const mStart = this.addMonthsUTC(end, -i);
      const mEnd = this.addMonthsUTC(end, -i + 1);
      const ym = this.ymOf(mStart);

      const qb = this.payRepo
        .createQueryBuilder('p')
        .select('COALESCE(SUM(p.total_amount_clp), 0)', 'gross')
        .addSelect('COALESCE(SUM(p.net_amount_clp), 0)', 'net')
        .addSelect('COALESCE(SUM(p.vat_amount_clp), 0)', 'vat')
        .where('p.gym_id = :g', { g: dto.gymId })
        .andWhere('p.paid_at >= :s AND p.paid_at < :e', { s: mStart, e: mEnd });

      const row = await qb.getRawOne<{ gross: string; net: string; vat: string }>();
      points.push({
        month: ym,
        grossClp: Number(row?.gross ?? 0),
        netClp: Number(row?.net ?? 0),
        vatClp: Number(row?.vat ?? 0),
      });
    }

    return { points };
  }

  // ----------------- ÚLTIMOS PAGOS -----------------
  async recentPayments(dto: RecentPaymentsDto) {
    const payments = await this.payRepo.find({
      where: { gymId: dto.gymId },
      order: { paidAt: 'DESC' },
      take: dto.limit,
    });
    return { payments };
  }
}
