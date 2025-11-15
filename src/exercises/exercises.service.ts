import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { Exercise } from './entities/exercise.entity';
import { Machine } from '../machines/entities/machine.entity';
import { CreateExerciseDto } from './dto/create-exercise.dto';
import { UpdateExerciseDto } from './dto/update-exercise.dto';
import { QueryExercisesDto } from './dto/query-exercises.dto';

@Injectable()
export class ExercisesService {
  constructor(
    @InjectRepository(Exercise) private readonly repo: Repository<Exercise>,
    @InjectRepository(Machine) private readonly machinesRepo: Repository<Machine>,
  ) {}

  // ---------- helpers ----------
  private ensureGym(id: string) {
    if (!id) throw new BadRequestException('gymId requerido');
  }

  private isAllowedVideoHost(u: URL) {
    const host = u.hostname.toLowerCase();
    return (
      host.includes('youtube.com') ||
      host.includes('youtu.be') ||
      host.includes('vimeo.com') ||
      host.includes('tiktok.com') ||
      host.includes('instagram.com') ||
      host.includes('facebook.com')
    );
  }

  private validateVideoUrlOrThrow(videoUrl?: string) {
    if (!videoUrl) return;
    try {
      const u = new URL(videoUrl);
      if (!this.isAllowedVideoHost(u)) {
        throw new BadRequestException('Dominio de video no permitido');
      }
    } catch {
      throw new BadRequestException('URL de video inválida');
    }
  }

  private async assertMachineSameGym(machineId: string, gymId: string) {
    const m = await this.machinesRepo.findOne({ where: { id: machineId, gymId } });
    if (!m) throw new BadRequestException('machineId inválido para este gimnasio');
  }

  private async assertNotDuplicateName(gymId: string, name: string, ignoreId?: string) {
    const found = await this.repo
      .createQueryBuilder('e')
      .where('e.gym_id = :g AND LOWER(e.name) = LOWER(:n)', { g: gymId, n: name })
      .andWhere(ignoreId ? 'e.id <> :id' : '1=1', ignoreId ? { id: ignoreId } : {})
      .andWhere('e.deleted_at IS NULL')
      .getOne();
    if (found) throw new BadRequestException('Ya existe un ejercicio con ese nombre');
  }

  private async getOne(id: string, gymId: string) {
    const e = await this.repo.findOne({ where: { id, gymId } });
    if (!e) throw new NotFoundException('Ejercicio no encontrado');
    return e;
  }

  // ---------- CRUD ----------
  async create(dto: CreateExerciseDto) {
    this.ensureGym(dto.gymId);
    this.validateVideoUrlOrThrow(dto.videoUrl);
    if (dto.machineId) await this.assertMachineSameGym(dto.machineId, dto.gymId);
    await this.assertNotDuplicateName(dto.gymId, dto.name);

    const row = this.repo.create({
      gymId: dto.gymId,
      name: dto.name,
      type: dto.type ?? undefined,
      difficulty: dto.difficulty ?? undefined,
      primaryMuscleId: dto.primaryMuscleId ?? null,
      description: dto.description ?? null,
      imageUrl: dto.imageUrl ?? null,
      videoUrl: dto.videoUrl ?? null,
      machineId: dto.machineId ?? null,
      notes: dto.notes ?? null,
      isActive: dto.isActive ?? true,
    });
    return this.repo.save(row);
  }

  async findAll(q: QueryExercisesDto) {
    this.ensureGym(q.gymId);
    const where: any = { gymId: q.gymId };

    if (q.search) where.name = ILike(`%${q.search}%`);
    if (q.type) where.type = q.type;
    if (q.primaryMuscleId) where.primaryMuscleId = q.primaryMuscleId;
    if (q.difficulty) where.difficulty = q.difficulty;
    if (q.machineId) where.machineId = q.machineId;
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
    return this.getOne(id, gymId);
  }

  async update(id: string, gymId: string, dto: UpdateExerciseDto) {
    const e = await this.getOne(id, gymId);

    if (dto.name && dto.name !== e.name) {
      await this.assertNotDuplicateName(gymId, dto.name, id);
    }
    if (dto.videoUrl !== undefined) this.validateVideoUrlOrThrow(dto.videoUrl);
    if (dto.machineId) await this.assertMachineSameGym(dto.machineId, gymId);
    if (dto.machineId === null) e.machineId = null; // desvincular

    Object.assign(e, {
      name: dto.name ?? e.name,
      type: dto.type ?? e.type,
      difficulty: dto.difficulty ?? e.difficulty,
      primaryMuscleId: dto.primaryMuscleId !== undefined ? dto.primaryMuscleId : e.primaryMuscleId,
      description: dto.description ?? e.description,
      imageUrl: dto.imageUrl ?? e.imageUrl,
      videoUrl: dto.videoUrl ?? e.videoUrl,
      machineId: dto.machineId !== undefined ? dto.machineId : e.machineId,
      notes: dto.notes ?? e.notes,
      isActive: typeof dto.isActive === 'boolean' ? dto.isActive : e.isActive,
    });

    return this.repo.save(e);
  }

  async activate(id: string, gymId: string) {
    const e = await this.getOne(id, gymId);
    if (e.isActive) return e;
    e.isActive = true;
    return this.repo.save(e);
  }

  async deactivate(id: string, gymId: string) {
    const e = await this.getOne(id, gymId);
    if (!e.isActive) return e;
    e.isActive = false;
    return this.repo.save(e);
  }

  async remove(id: string, gymId: string) {
    const e = await this.getOne(id, gymId);
    await this.repo.softRemove(e);
    return { ok: true };
  }
}
