import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, LessThanOrEqual, MoreThanOrEqual, Repository } from 'typeorm';
import { ClientMetric } from './entities/client-metric.entity';
import { CreateClientMetricDto } from './dto/create-client-metric.dto';
import { QueryClientMetricsDto } from './dto/query-client-metrics.dto';

@Injectable()
export class ClientMetricsService {
  constructor(
    @InjectRepository(ClientMetric)
    private readonly repo: Repository<ClientMetric>,
  ) {}

  async create(dto: CreateClientMetricDto) {
    const row = this.repo.create({
      gymId: dto.gymId,
      clientId: dto.clientId,
      measuredAt: dto.measuredAt ? new Date(dto.measuredAt) : new Date(),
      weightKg: dto.weightKg ?? null,
      heightCm: dto.heightCm ?? null,
      bodyFatPercent: dto.bodyFatPercent ?? null,
      muscleKg: dto.muscleKg ?? null,
      notes: dto.notes ?? null,
    });
    return this.repo.save(row);
  }

  async findAll(q: QueryClientMetricsDto) {
    const where: any = { gymId: q.gymId };
    if (q.clientId) where.clientId = q.clientId;

    if (q.dateFrom && q.dateTo) {
      where.measuredAt = Between(new Date(q.dateFrom), new Date(q.dateTo));
    } else if (q.dateFrom) {
      where.measuredAt = MoreThanOrEqual(new Date(q.dateFrom));
    } else if (q.dateTo) {
      where.measuredAt = LessThanOrEqual(new Date(q.dateTo));
    }

    const [data, total] = await this.repo.findAndCount({
      where,
      order: { measuredAt: 'DESC' },
      skip: q.offset ?? 0,
      take: q.limit ?? 50,
    });
    return { data, total };
  }

  async latest(gymId: string, clientId: string) {
    const row = await this.repo.findOne({
      where: { gymId, clientId },
      order: { measuredAt: 'DESC' },
    });
    return { metric: row ?? null };
  }

  async remove(id: string, gymId: string) {
    const row = await this.repo.findOne({ where: { id, gymId } });
    if (!row) throw new NotFoundException('Registro no encontrado');
    await this.repo.remove(row);
    return { ok: true };
  }
}
