import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThanOrEqual, LessThanOrEqual } from 'typeorm';
import { SessionBurn, BurnMethodEnum } from './entities/session-burn.entity';
import { SessionQrToken } from './entities/session-qr-token.entity';
import { GenerateQrDto } from './dto/generate-qr.dto';
import { RedeemQrDto } from './dto/redeem-qr.dto';
import { ManualBurnDto } from './dto/manual-burn.dto';
import { QueryBurnsDto } from './dto/query-burns.dto';
import { QueryQrDto } from './dto/query-qr.dto';
import { MembershipsService } from '../memberships/memberships.service';
import {
  Membership,
  MembershipStatusEnum,
} from '../memberships/entities/membership.entity';
import { User, RoleEnum } from '../users/entities/user.entity';
import { randomBytes } from 'crypto';

@Injectable()
export class SessionBurnsService {
  private readonly QR_TTL_MINUTES = 15;

  constructor(
    @InjectRepository(SessionBurn)
    private readonly burnsRepo: Repository<SessionBurn>,
    @InjectRepository(SessionQrToken)
    private readonly qrRepo: Repository<SessionQrToken>,
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
    @InjectRepository(Membership)
    private readonly membRepo: Repository<Membership>,
    private readonly membershipsService: MembershipsService,
  ) {}

  private now(): Date {
    return new Date();
  }

  private isoDay(d: Date): string {
    const y = d.getUTCFullYear();
    const m = String(d.getUTCMonth() + 1).padStart(2, '0');
    const day = String(d.getUTCDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  private async assertRole(userId: string, allowed: RoleEnum[]) {
    const u = await this.usersRepo.findOne({ where: { id: userId } });
    if (!u) throw new NotFoundException('Usuario no encontrado');
    // FIXME: u.role no existe en la BD nueva (está en gym_users)
    // Por ahora permitir cualquier usuario, validación debe hacerse con gymUser.role
    // if (!allowed.includes(u.role)) {
    //   throw new ForbiddenException('No autorizado para esta acción');
    // }
    return u;
  }

  private async assertClient(clientId: string) {
    const u = await this.usersRepo.findOne({ where: { id: clientId } });
    if (!u) throw new NotFoundException('Cliente no encontrado');
    if (u.role !== RoleEnum.CLIENT) {
      throw new BadRequestException('El usuario indicado no es un cliente');
    }
    return u;
  }

  private async resolveActiveMembership(clientId: string) {
    const m = await this.membershipsService.getActiveForClient(clientId);
    if (!m) throw new ForbiddenException('No tiene membresía activa');
    return m;
  }

  private async getMembershipOrActive(
    clientGymUserId: string,
    membershipId?: string,
  ) {
    if (membershipId) {
      const m = await this.membRepo.findOne({
        where: { id: membershipId, clientGymUserId },
      });
      if (!m) throw new NotFoundException('Membresía no encontrada');
      if (m.status !== MembershipStatusEnum.ACTIVE) {
        throw new ForbiddenException('La membresía no está activa');
      }
      return m;
    }
    return this.resolveActiveMembership(clientGymUserId);
  }

  private generateToken(): string {
    // 32 bytes -> ~43 chars base64url
    return randomBytes(32).toString('base64url');
  }

  // ---------- QR ----------
  async generateQr(dto: GenerateQrDto) {
    await this.assertRole(dto.createdByUserId, [
      RoleEnum.ADMIN,
      RoleEnum.TRAINER,
    ]);
    await this.assertClient(dto.clientId);

    const m = await this.getMembershipOrActive(
      dto.clientId,
      dto.membershipId,
    );

    if (m.sessionsQuota <= 0) {
      throw new BadRequestException('El plan no incluye sesiones privadas');
    }
    if (m.sessionsUsed >= m.sessionsQuota) {
      throw new BadRequestException('No quedan sesiones privadas disponibles');
    }

    const token = this.generateToken();
    const expiresAt = new Date(
      this.now().getTime() + this.QR_TTL_MINUTES * 60 * 1000,
    );

    const row = this.qrRepo.create({
      gymId: dto.gymId,
      membershipId: m.id,
      clientId: dto.clientId,
      createdByUserId: dto.createdByUserId,
      token,
      expiresAt,
      usedAt: null,
      usedByClientId: null,
      revoked: false,
    });

    const saved = await this.qrRepo.save(row);

    // Retorna solo lo necesario para renderizar el QR (el token)
    return {
      id: saved.id,
      token: saved.token,
      expiresAt: saved.expiresAt,
      membershipId: saved.membershipId,
      clientId: saved.clientId,
      note: dto.note ?? null,
    };
  }

  async redeemQr(dto: RedeemQrDto) {
    await this.assertClient(dto.clientId);

    const qr = await this.qrRepo.findOne({
      where: { token: dto.token, gymId: dto.gymId },
    });
    if (!qr) throw new NotFoundException('QR no válido');
    if (qr.revoked) throw new BadRequestException('QR revocado');
    if (qr.usedAt) throw new BadRequestException('QR ya utilizado');

    const now = this.now();
    if (qr.expiresAt.getTime() < now.getTime()) {
      throw new BadRequestException('QR expirado');
    }

    // El cliente que escanea debe ser el mismo al que se emitió el QR
    if (qr.clientId !== dto.clientId) {
      throw new ForbiddenException('Este QR no pertenece a tu cuenta');
    }

    // Confirmar que la membresía siga activa y con cupo
    // Note: qr.clientId is the gym_user_id from SessionQrToken entity
    const m = await this.membRepo.findOne({
      where: { id: qr.membershipId, clientGymUserId: qr.clientId },
    });
    if (!m || m.clientGymUserId !== qr.clientId)
      throw new NotFoundException('Membresía no encontrada');
    if (m.status !== MembershipStatusEnum.ACTIVE)
      throw new ForbiddenException('La membresía no está activa');
    if (m.sessionsUsed >= m.sessionsQuota)
      throw new BadRequestException('No quedan sesiones privadas');

    // Consumir 1 sesión
    await this.membershipsService.useSessions(m.id, {
      count: 1,
      note: 'QR redeem',
    });

    // Marcar token como usado
    qr.usedAt = now;
    qr.usedByClientId = dto.clientId;
    await this.qrRepo.save(qr);

    // Registrar burn
    const burn = this.burnsRepo.create({
      gymId: dto.gymId,
      membershipId: m.id,
      clientId: dto.clientId,
      method: BurnMethodEnum.QR,
      burnedByUserId: null,
      redeemedByClientId: dto.clientId,
      note: null,
    });
    return this.burnsRepo.save(burn);
  }

  async revokeQr(id: string, gymId: string, byUserId: string) {
    await this.assertRole(byUserId, [RoleEnum.ADMIN, RoleEnum.TRAINER]);
    const qr = await this.qrRepo.findOne({ where: { id, gymId } });
    if (!qr) throw new NotFoundException('QR no encontrado');
    if (qr.usedAt) throw new BadRequestException('QR ya utilizado; no se puede revocar');
    qr.revoked = true;
    return this.qrRepo.save(qr);
  }

  async listQr(q: QueryQrDto) {
    const where: any = { gymId: q.gymId };
    if (q.clientId) where.clientId = q.clientId;
    const [data, total] = await this.qrRepo.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip: q.offset,
      take: q.limit,
    });
    return { data, total };
  }

  // ---------- MANUAL ----------
  async manualBurn(dto: ManualBurnDto) {
    await this.assertRole(dto.burnedByUserId, [
      RoleEnum.ADMIN,
      RoleEnum.TRAINER,
    ]);
    await this.assertClient(dto.clientId);

    const m = await this.getMembershipOrActive(
      dto.clientId,
      dto.membershipId,
    );

    if (m.sessionsQuota <= 0) {
      throw new BadRequestException('El plan no incluye sesiones privadas');
    }
    if (m.sessionsUsed >= m.sessionsQuota) {
      throw new BadRequestException('No quedan sesiones privadas disponibles');
    }

    // Consumir 1
    await this.membershipsService.useSessions(m.id, {
      count: 1,
      note: dto.note ?? 'Manual burn',
    });

    const burn = this.burnsRepo.create({
      gymId: dto.gymId,
      membershipId: m.id,
      clientId: dto.clientId,
      method: BurnMethodEnum.MANUAL,
      burnedByUserId: dto.burnedByUserId,
      redeemedByClientId: null,
      note: dto.note ?? null,
    });

    return this.burnsRepo.save(burn);
  }

  // ---------- LISTADO ----------
  async listBurns(q: QueryBurnsDto) {
    const where: any = { gymId: q.gymId };
    if (q.clientId) where.clientId = q.clientId;

    if (q.dateFrom && q.dateTo) {
      where.burnedAt = Between(new Date(q.dateFrom), new Date(q.dateTo));
    } else if (q.dateFrom) {
      where.burnedAt = MoreThanOrEqual(new Date(q.dateFrom));
    } else if (q.dateTo) {
      where.burnedAt = LessThanOrEqual(new Date(q.dateTo));
    }

    const [data, total] = await this.burnsRepo.findAndCount({
      where,
      order: { burnedAt: 'DESC' },
      skip: q.offset,
      take: q.limit,
    });
    return { data, total };
  }
}
