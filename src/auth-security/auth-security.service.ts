import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, IsNull } from 'typeorm';
import { LoginAttempt } from './entities/login-attempt.entity';

export interface LockoutConfig {
  maxFails: number;        // e.g. 5
  windowMinutes: number;   // e.g. 15
  lockMinutes: number;     // e.g. 15
}

const DEFAULTS: LockoutConfig = {
  maxFails: 5,
  windowMinutes: 15,
  lockMinutes: 15,
};

@Injectable()
export class AuthSecurityService {
  constructor(
    @InjectRepository(LoginAttempt)
    private readonly repo: Repository<LoginAttempt>,
  ) {}

  private now() { return new Date(); }

  async isLocked(gymId: string, userId: string) {
    const row = await this.repo.findOne({ where: { gymId, userId } });
    if (!row?.lockedUntil) return { locked: false, until: null as Date | null };
    const locked = row.lockedUntil.getTime() > this.now().getTime();
    return { locked, until: locked ? row.lockedUntil : null };
  }

  /**
   * Llamar cuando el login fue correcto (limpia intentos).
   */
  async clear(gymId: string, userId: string) {
    const row = await this.repo.findOne({ where: { gymId, userId } });
    if (!row) return;
    row.failCount = 0;
    row.firstFailedAt = null;
    row.lastFailedAt = null;
    row.lockedUntil = null;
    await this.repo.save(row);
  }

  /**
   * Llamar cuando el login falla (password incorrecto).
   * Devuelve el estado (si fue bloqueado y hasta cuándo).
   */
  async registerFailed(
    gymId: string,
    userId: string,
    ip?: string | null,
    cfg: Partial<LockoutConfig> = {},
  ) {
    const { maxFails, windowMinutes, lockMinutes } = { ...DEFAULTS, ...cfg };
    const now = this.now();
    let row = await this.repo.findOne({ where: { gymId, userId } });

    // Si está bloqueado y sigue vigente, solo actualiza IP y retorna estado bloqueado
    if (row?.lockedUntil && row.lockedUntil.getTime() > now.getTime()) {
      if (ip) {
        row.lastIp = ip;
        await this.repo.save(row);
      }
      return { locked: true, until: row.lockedUntil };
    }

    if (!row) {
      row = this.repo.create({
        gymId,
        userId,
        failCount: 1,
        firstFailedAt: now,
        lastFailedAt: now,
        lockedUntil: null,
        lastIp: ip ?? null,
      });
      await this.repo.save(row);
      return { locked: false, until: null as Date | null };
    }

    // Si la ventana expiró, reinicia contador
    const windowMs = windowMinutes * 60 * 1000;
    if (!row.firstFailedAt || now.getTime() - row.firstFailedAt.getTime() > windowMs) {
      row.failCount = 1;
      row.firstFailedAt = now;
      row.lastFailedAt = now;
      row.lockedUntil = null;
      row.lastIp = ip ?? row.lastIp ?? null;
      await this.repo.save(row);
      return { locked: false, until: null as Date | null };
    }

    // Dentro de ventana
    row.failCount += 1;
    row.lastFailedAt = now;
    row.lastIp = ip ?? row.lastIp ?? null;

    if (row.failCount >= maxFails) {
      const until = new Date(now.getTime() + lockMinutes * 60 * 1000);
      row.lockedUntil = until;
      await this.repo.save(row);
      return { locked: true, until };
    }

    await this.repo.save(row);
    return { locked: false, until: null as Date | null };
  }

  /**
   * Limpia estados viejos: opcional (si usas cron/ops).
   * Elimina filas sin bloqueo y sin actividad en >90 días.
   */
  async cleanup() {
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    await this.repo.delete({
      lockedUntil: IsNull(),
      updatedAt: LessThan(ninetyDaysAgo),
    });
  }
}
