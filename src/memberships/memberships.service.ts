import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Membership, MembershipStatusEnum } from './entities/membership.entity';
import { Plan } from '../plans/entities/plan.entity';
import { User, RoleEnum } from '../users/entities/user.entity';
import { CreateMembershipFromPlanDto } from './dto/create-membership-from-plan.dto';
import { UseSessionsDto } from './dto/use-sessions.dto';
import { QueryMembershipsDto } from './dto/query-memberships.dto';

function todayIso(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
function addMonthsInclusive(startISO: string, months: number): string {
  const [y, m, d] = startISO.split('-').map(Number);
  const start = new Date(Date.UTC(y, m - 1, d));
  const end = new Date(Date.UTC(y, m - 1 + months, d));
  // endDate inclusivo: restamos 1 día
  end.setUTCDate(end.getUTCDate() - 1);
  return end.toISOString().slice(0, 10);
}
function addDaysInclusive(startISO: string, days: number): string {
  const [y, m, d] = startISO.split('-').map(Number);
  const end = new Date(Date.UTC(y, m - 1, d));
  end.setUTCDate(end.getUTCDate() + (days - 1));
  return end.toISOString().slice(0, 10);
}

@Injectable()
export class MembershipsService {
  constructor(
    @InjectRepository(Membership) private readonly repo: Repository<Membership>,
    @InjectRepository(Plan) private readonly plansRepo: Repository<Plan>,
    @InjectRepository(User) private readonly usersRepo: Repository<User>,
  ) {}

  private async assertAdmin(byUserId: string, gymId: string) {
    const u = await this.usersRepo.findOne({ where: { id: byUserId, gymId } });
    if (!u) throw new NotFoundException('Usuario no pertenece al gimnasio');
    if (u.role !== RoleEnum.ADMIN) throw new ForbiddenException('Solo ADMIN');
    return u;
  }

  async getActiveForClient(clientId: string, gymId: string, activeAtISO?: string) {
    const d = activeAtISO ?? todayIso();
    const rows = await this.repo.find({
      where: {
        gymId,
        clientId,
        status: MembershipStatusEnum.ACTIVE,
        startDate: Between('0001-01-01', d),
        endDate: Between(d, '9999-12-31'),
      },
      order: { endDate: 'ASC' },
      take: 1,
    });
    return rows[0] ?? null;
  }

  async useSessions(membershipId: string, dto: UseSessionsDto) {
    const m = await this.repo.findOne({ where: { id: membershipId, gymId: dto.gymId } });
    if (!m) throw new NotFoundException('Membresía no encontrada');
    if (m.status !== MembershipStatusEnum.ACTIVE) {
      throw new BadRequestException('Membresía no está activa');
    }
    if (m.sessionsQuota <= 0) {
      throw new BadRequestException('La membresía no incluye sesiones privadas');
    }
    if (m.sessionsUsed + dto.count > m.sessionsQuota) {
      throw new BadRequestException('No hay suficientes sesiones disponibles');
    }
    m.sessionsUsed += dto.count;
    return this.repo.save(m);
  }

  async createFromPlan(dto: CreateMembershipFromPlanDto) {
    await this.assertAdmin(dto.byUserId, dto.gymId);

    const [plan, client] = await Promise.all([
      this.plansRepo.findOne({ where: { id: dto.planId, gymId: dto.gymId } }),
      this.usersRepo.findOne({ where: { id: dto.clientId, gymId: dto.gymId } }),
    ]);
    if (!plan) throw new BadRequestException('Plan inválido para este gym');
    if (!client) throw new BadRequestException('Cliente inválido');
    if (client.role !== RoleEnum.CLIENT) throw new BadRequestException('clientId no corresponde a un CLIENT');

    const startDate = dto.startDate ?? todayIso();

    let endDate: string;
    if (plan.durationMonths && !plan.durationDays) {
      endDate = addMonthsInclusive(startDate, plan.durationMonths);
    } else if (plan.durationDays && !plan.durationMonths) {
      endDate = addDaysInclusive(startDate, plan.durationDays);
    } else {
      throw new BadRequestException('El plan debe tener duración por meses XOR días');
    }

    const row = this.repo.create({
      gymId: dto.gymId,
      clientId: dto.clientId,
      planId: plan.id,
      startDate,
      endDate,
      status: MembershipStatusEnum.ACTIVE,
      sessionsQuota: plan.privateSessionsPerPeriod ?? 0,
      sessionsUsed: 0,
      note: dto.note ?? null,
    });

    return this.repo.save(row);
  }

  async list(q: QueryMembershipsDto) {
    const where: any = { gymId: q.gymId };
    if (q.clientId) where.clientId = q.clientId;

    if (q.activeAt) {
      where.status = MembershipStatusEnum.ACTIVE;
      where.startDate = Between('0001-01-01', q.activeAt);
      where.endDate = Between(q.activeAt, '9999-12-31');
    }

    const [data, total] = await this.repo.findAndCount({
      where,
      order: { endDate: 'DESC' },
      skip: q.offset ?? 0,
      take: q.limit ?? 20,
    });
    return { data, total };
  }

  async setStatus(id: string, gymId: string, byUserId: string, status: MembershipStatusEnum) {
    await this.assertAdmin(byUserId, gymId);
    const m = await this.repo.findOne({ where: { id, gymId } });
    if (!m) throw new NotFoundException('Membresía no encontrada');
    m.status = status;
    return this.repo.save(m);
  }
}
