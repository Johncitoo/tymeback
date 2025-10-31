// src/gyms/gyms.service.ts
import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
  import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { Gym } from './entities/gym.entity';
import { CreateGymDto } from './dto/create-gym.dto';
import { UpdateGymDto } from './dto/update-gym.dto';
import { QueryGymsDto } from './dto/query-gyms.dto';

@Injectable()
export class GymsService {
  constructor(
    @InjectRepository(Gym)
    private readonly repo: Repository<Gym>,
  ) {}

  private slugify(input: string): string {
    return input
      .toLowerCase()
      .trim()
      .replace(/['"’`]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  async create(dto: CreateGymDto): Promise<Gym> {
    const slug = dto.slug?.trim() || this.slugify(dto.name);
    const gym = this.repo.create({ name: dto.name, slug });

    try {
      return await this.repo.save(gym);
    } catch (err: any) {
      // Unique violation (Postgres)
      if (err?.code === '23505') {
        throw new ConflictException('El slug ya existe en otro gimnasio');
      }
      throw err;
    }
  }

  async findAll(qry: QueryGymsDto): Promise<{ data: Gym[]; total: number }> {
    const where = qry.q
      ? [{ name: ILike(`%${qry.q}%`) }, { slug: ILike(`%${qry.q}%`) }]
      : {};
    const [data, total] = await this.repo.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip: qry.offset ?? 0,
      take: qry.limit ?? 20,
    });
    return { data, total };
  }

  async findOne(id: string): Promise<Gym> {
    const gym = await this.repo.findOne({ where: { id } });
    if (!gym) throw new NotFoundException('Gimnasio no encontrado');
    return gym;
  }

  async findBySlug(slug: string): Promise<Gym> {
    const gym = await this.repo.findOne({ where: { slug: slug.toLowerCase() } });
    if (!gym) throw new NotFoundException('Gimnasio no encontrado');
    return gym;
  }

  async update(id: string, dto: UpdateGymDto): Promise<Gym> {
    const gym = await this.findOne(id);
    if (dto.name !== undefined) gym.name = dto.name;
    if (dto.slug !== undefined) gym.slug = dto.slug || this.slugify(gym.name);

    try {
      return await this.repo.save(gym);
    } catch (err: any) {
      if (err?.code === '23505') {
        throw new ConflictException('El slug ya existe en otro gimnasio');
      }
      throw err;
    }
  }

  async remove(id: string): Promise<{ id: string }> {
    // Hard delete (si prefieres, cambia por soft-delete cuando lo definamos en DB)
    const res = await this.repo.delete(id);
    if (res.affected === 0) {
      throw new NotFoundException('Gimnasio no encontrado');
    }
    return { id };
  }
}
