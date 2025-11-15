import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import { Membership, MembershipStatusEnum } from './entities/membership.entity';
import { QueryMembershipsDto } from './dto/query-memberships.dto';

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

@Injectable()
export class MembershipsService {
  constructor(
    @InjectRepository(Membership)
    private readonly repo: Repository<Membership>,
  ) {}

  // TODO: Restaurar funcionalidades completas cuando se necesiten
  // Por ahora solo métodos de lectura básicos

  async list(dto: QueryMembershipsDto) {
    const today = dto.activeAt ?? todayIso();
    const where: any = {};
    
    if (dto.clientId) {
      where.clientId = dto.clientId;
    }

    const rows = await this.repo.find({
      where,
      order: { endsOn: 'DESC' },
      take: dto.limit ?? 50,
    });

    return { data: rows, total: rows.length };
  }

  async findOne(id: string) {
    const m = await this.repo.findOne({ where: { id } });
    if (!m) throw new NotFoundException('Membership not found');
    return m;
  }

  // Métodos simplificados - TODO: implementar lógica completa
  async create(data: any): Promise<Membership> {
    throw new Error('Not implemented - create membership');
  }

  async burnSessions(membershipId: string, dto: any) {
    throw new Error('Not implemented - burn sessions');
  }

  async updateStatus(id: string, status: MembershipStatusEnum) {
    throw new Error('Not implemented - update status');
  }
}
