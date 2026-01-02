import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { Plan } from './entities/plan.entity';
import { CreatePlanDto } from './dto/create-plan.dto';
import { UpdatePlanDto } from './dto/update-plan.dto';

@Injectable()
export class PlansService {
  constructor(@InjectRepository(Plan) private readonly repo: Repository<Plan>) {}

  async create(dto: CreatePlanDto) {
    // Validar que al menos uno de los campos de duración esté presente
    if (!dto.durationMonths && !dto.durationDays) {
      throw new BadRequestException('Debe especificar al menos duración en meses o días');
    }
    const row = this.repo.create({
      gymId: dto.gymId,
      name: dto.name,
      description: dto.description ?? null,
      durationMonths: dto.durationMonths ?? null,
      durationDays: dto.durationDays ?? null,
      priceClp: dto.priceClp,
      privateSessionsPerPeriod: dto.privateSessionsPerPeriod ?? 0,
      isActive: dto.isActive ?? true,
    });
    return this.repo.save(row);
  }

  async findAll(gymId: string, q?: string) {
    const where: any = { gymId };
    if (q) where.name = ILike(`%${q}%`);
    return this.repo.find({ where, order: { name: 'ASC' } });
  }

  async findOne(id: string, gymId: string) {
    const row = await this.repo.findOne({ where: { id, gymId } });
    if (!row) throw new NotFoundException('Plan no encontrado');
    return row;
  }

  async update(id: string, gymId: string, dto: UpdatePlanDto) {
    const row = await this.findOne(id, gymId);
    
    // Validar que después de la actualización haya al menos una duración
    const newDurationMonths = dto.durationMonths !== undefined ? dto.durationMonths : row.durationMonths;
    const newDurationDays = dto.durationDays !== undefined ? dto.durationDays : row.durationDays;
    
    if (!newDurationMonths && !newDurationDays) {
      throw new BadRequestException('El plan debe tener al menos duración en meses o días');
    }
    
    Object.assign(row, {
      name: dto.name ?? row.name,
      description: dto.description ?? row.description,
      durationMonths: dto.durationMonths ?? row.durationMonths,
      durationDays: dto.durationDays ?? row.durationDays,
      priceClp: dto.priceClp ?? row.priceClp,
      privateSessionsPerPeriod: dto.privateSessionsPerPeriod ?? row.privateSessionsPerPeriod,
      isActive: dto.isActive ?? row.isActive,
    });
    return this.repo.save(row);
  }

  async remove(id: string, gymId: string) {
    const row = await this.findOne(id, gymId);
    await this.repo.remove(row);
    return { ok: true };
  }
}
