import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
  import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { Machine, MachineTypeEnum, MuscleGroupEnum } from './entities/machine.entity';
import { MachineMaintenance } from './entities/machine-maintenance.entity';
import { CreateMachineDto } from './dto/create-machine.dto';
import { UpdateMachineDto } from './dto/update-machine.dto';
import { QueryMachinesDto } from './dto/query-machines.dto';
import { CreateMaintenanceDto } from './dto/create-maintenance.dto';
import { User, RoleEnum } from '../users/entities/user.entity';
import { SesMailerService } from '../communications/mailer/ses-mailer.service';

@Injectable()
export class MachinesService {
  constructor(
    @InjectRepository(Machine) private readonly repo: Repository<Machine>,
    @InjectRepository(MachineMaintenance) private readonly maintRepo: Repository<MachineMaintenance>,
    @InjectRepository(User) private readonly usersRepo: Repository<User>,
    private readonly mailer: SesMailerService,
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
      <p>La máquina <strong>${machine.name}</strong> (grupo muscular: ${machine.muscleGroup}) fue marcada como <strong>FUERA DE SERVICIO</strong>.</p>
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
      muscleGroup: dto.muscleGroup ?? MuscleGroupEnum.OTHER,
      description: dto.description ?? null,
      specs: dto.specs ?? null,
      safetyNotes: dto.safetyNotes ?? null,
      imageUrl: dto.imageUrl ?? null,
      imageFileId: dto.imageFileId ?? null,
      isActive: dto.isActive ?? true,
      inService: dto.inService ?? true,
      serialNumber: dto.serialNumber ?? null,
      purchaseDate: dto.purchaseDate ?? null,
      warrantyInfo: dto.warrantyInfo ?? null,
      location: dto.location ?? null,
    });
    return this.repo.save(row);
  }

  async findAll(q: QueryMachinesDto) {
    this.ensureGym(q.gymId);
    const where: any = { gymId: q.gymId };

    if (q.search) where.name = ILike(`%${q.search}%`);
    if (q.type) where.type = q.type;
    if (q.muscleGroup) where.muscleGroup = q.muscleGroup;
    if (typeof q.inService === 'string') where.inService = q.inService === 'true';
    if (typeof q.isActive === 'string') where.isActive = q.isActive === 'true';

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
    const wasInService = m.inService;

    Object.assign(m, {
      name: dto.name ?? m.name,
      type: dto.type ?? m.type,
      muscleGroup: dto.muscleGroup ?? m.muscleGroup,
      description: dto.description ?? m.description,
      specs: dto.specs ?? m.specs,
      safetyNotes: dto.safetyNotes ?? m.safetyNotes,
      imageUrl: dto.imageUrl ?? m.imageUrl,
      imageFileId: dto.imageFileId ?? m.imageFileId,
      isActive: typeof dto.isActive === 'boolean' ? dto.isActive : m.isActive,
      inService: typeof dto.inService === 'boolean' ? dto.inService : m.inService,
      serialNumber: dto.serialNumber ?? m.serialNumber,
      purchaseDate: dto.purchaseDate ?? m.purchaseDate,
      warrantyInfo: dto.warrantyInfo ?? m.warrantyInfo,
      location: dto.location ?? m.location,
    });

    const saved = await this.repo.save(m);

    // Si pasó a fuera de servicio ahora → notificar
    if (wasInService && saved.inService === false) {
      await this.notifyAdminsMachineOOS(gymId, saved);
    }

    return saved;
  }

  async setOutOfService(id: string, gymId: string) {
    const m = await this.findOne(id, gymId);
    if (!m.inService) return m;
    m.inService = false;
    const saved = await this.repo.save(m);
    await this.notifyAdminsMachineOOS(gymId, saved);
    return saved;
  }

  async setInService(id: string, gymId: string) {
    const m = await this.findOne(id, gymId);
    if (m.inService) return m;
    m.inService = true;
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
