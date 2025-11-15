import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
  import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { Machine, MachineTypeEnum } from './entities/machine.entity';
import { MachineMaintenance } from './entities/machine-maintenance.entity';
import { CreateMachineDto } from './dto/create-machine.dto';
import { UpdateMachineDto } from './dto/update-machine.dto';
import { QueryMachinesDto } from './dto/query-machines.dto';
import { CreateMaintenanceDto } from './dto/create-maintenance.dto';
import { User, RoleEnum } from '../users/entities/user.entity';
import { ResendMailerService } from '../communications/mailer/resend-mailer.service';

@Injectable()
export class MachinesService {
  constructor(
    @InjectRepository(Machine) private readonly repo: Repository<Machine>,
    @InjectRepository(MachineMaintenance) private readonly maintRepo: Repository<MachineMaintenance>,
    @InjectRepository(User) private readonly usersRepo: Repository<User>,
    private readonly mailer: ResendMailerService,
  ) {}

  // --------- helpers ---------
  private ensureGym(id: string) {
    if (!id) throw new BadRequestException('gymId requerido');
  }

  private async notifyAdminsMachineOOS(gymId: string, machine: Machine) {
    // Buscar admins activos del gimnasio
    const admins = await this.usersRepo.find({ where: { gymId, role: RoleEnum.ADMIN, isActive: true } });
    if (!admins.length) return;

    const subject = `Máquina fuera de servicio: ${machine.name}`;
    const html = `
      <p>Hola,</p>
      <p>La máquina <strong>${machine.name}</strong> fue marcada como <strong>FUERA DE SERVICIO</strong>.</p>
      ${machine.location ? `<p>Ubicación: ${machine.location}</p>` : ''}
      ${machine.safetyNotes ? `<p><em>Notas de seguridad:</em> ${machine.safetyNotes}</p>` : ''}
      <p>Por favor, revise y agende mantenimiento.</p>
    `;

    await Promise.all(
      admins
        .filter(a => !!a.email)
        .map(a => this.mailer.send(a.email!, subject, html))
    );
  }

  // --------- CRUD ---------
  async create(dto: CreateMachineDto) {
    this.ensureGym(dto.gymId);
    const row = this.repo.create({
      gymId: dto.gymId,
      name: dto.name,
      type: dto.type ?? MachineTypeEnum.STRENGTH,
      description: dto.description ?? null,
      specs: dto.specs ?? null,
      safetyNotes: dto.safetyNotes ?? null,
      imageUrl: dto.imageUrl ?? null,
      isOperational: dto.isOperational ?? true,
      serialNumber: dto.serialNumber ?? null,
      purchaseDate: dto.purchaseDate ?? null,
      warrantyMonths: dto.warrantyMonths ?? null,
      location: dto.location ?? null,
      usageNotes: dto.usageNotes ?? null,
    });
    return this.repo.save(row);
  }

  async findAll(q: QueryMachinesDto) {
    this.ensureGym(q.gymId);
    const where: any = { gymId: q.gymId };

    if (q.search) where.name = ILike(`%${q.search}%`);
    if (q.type) where.type = q.type;
    if (typeof q.isOperational === 'string') where.isOperational = q.isOperational === 'true';

    const [data, total] = await this.repo.findAndCount({
      where,
      order: { name: 'ASC' },
      skip: q.offset ?? 0,
      take: q.limit ?? 20,
    });

    return { data, total };
  }

  async findOne(id: string, gymId: string) {
    const m = await this.repo.findOne({ where: { id, gymId } });
    if (!m) throw new NotFoundException('Máquina no encontrada');
    return m;
  }

  async update(id: string, gymId: string, dto: UpdateMachineDto) {
    const m = await this.findOne(id, gymId);
    const wasOperational = m.isOperational;

    Object.assign(m, {
      name: dto.name ?? m.name,
      type: dto.type ?? m.type,
      description: dto.description ?? m.description,
      specs: dto.specs ?? m.specs,
      safetyNotes: dto.safetyNotes ?? m.safetyNotes,
      imageUrl: dto.imageUrl ?? m.imageUrl,
      isOperational: typeof dto.isOperational === 'boolean' ? dto.isOperational : m.isOperational,
      serialNumber: dto.serialNumber ?? m.serialNumber,
      purchaseDate: dto.purchaseDate ?? m.purchaseDate,
      warrantyMonths: dto.warrantyMonths ?? m.warrantyMonths,
      location: dto.location ?? m.location,
      usageNotes: dto.usageNotes ?? m.usageNotes,
    });

    const saved = await this.repo.save(m);

    // Si pasó a fuera de servicio ahora → notificar
    if (wasOperational && saved.isOperational === false) {
      await this.notifyAdminsMachineOOS(gymId, saved);
    }

    return saved;
  }

  async setOutOfService(id: string, gymId: string) {
    const m = await this.findOne(id, gymId);
    if (!m.isOperational) return m;
    m.isOperational = false;
    const saved = await this.repo.save(m);
    await this.notifyAdminsMachineOOS(gymId, saved);
    return saved;
  }

  async setInService(id: string, gymId: string) {
    const m = await this.findOne(id, gymId);
    if (m.isOperational) return m;
    m.isOperational = true;
    return this.repo.save(m);
  }

  async remove(id: string, gymId: string) {
    const m = await this.findOne(id, gymId);
    await this.repo.softRemove(m);
    return { ok: true };
  }

  // --------- Mantenimiento ---------
  async addMaintenance(dto: CreateMaintenanceDto) {
    if (dto.gymId && dto.machineId) {
      const mach = await this.findOne(dto.machineId, dto.gymId); // valida existencia/gym
      if (!mach) throw new NotFoundException('Máquina no encontrada');
    }

    const row = this.maintRepo.create({
      gymId: dto.gymId,
      machineId: dto.machineId,
      performedAt: new Date(dto.performedAt),
      description: dto.description,
      costClp: typeof dto.costClp === 'number' ? dto.costClp : null,
      performedByUserId: dto.performedByUserId ?? null,
      nextDueAt: dto.nextDueAt ? new Date(dto.nextDueAt) : null,
    });
    return this.maintRepo.save(row);
  }

  async listMaintenance(machineId: string, gymId: string) {
    const [data, total] = await this.maintRepo.findAndCount({
      where: { machineId, gymId },
      order: { performedAt: 'DESC' },
    });
    return { data, total };
  }
}
