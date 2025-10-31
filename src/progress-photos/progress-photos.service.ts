import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, LessThanOrEqual, MoreThanOrEqual, Repository } from 'typeorm';
import { ProgressPhoto } from './entities/progress-photo.entity';
import { CreateProgressPhotoDto } from './dto/create-progress-photo.dto';
import { QueryProgressPhotosDto } from './dto/query-progress-photos.dto';
import { AppFile, FileStatusEnum } from '../files/entities/file.entity';
import { Inject } from '@nestjs/common';

@Injectable()
export class ProgressPhotosService {
  constructor(
    @InjectRepository(ProgressPhoto)
    private readonly repo: Repository<ProgressPhoto>,
    @InjectRepository(AppFile)
    private readonly filesRepo: Repository<AppFile>,
  ) {}

  async create(dto: CreateProgressPhotoDto) {
    // Validar que el file exista y pertenezca al mismo gym, y esté READY
    const file = await this.filesRepo.findOne({
      where: { id: dto.fileId, gymId: dto.gymId },
    });
    if (!file) throw new NotFoundException('Archivo no encontrado');
    if (file.status !== FileStatusEnum.READY) {
      throw new BadRequestException('El archivo aún no está listo');
    }

    const row = this.repo.create({
      gymId: dto.gymId,
      clientId: dto.clientId,
      fileId: dto.fileId,
      takenAt: dto.takenAt ? new Date(dto.takenAt) : new Date(),
      note: dto.note ?? null,
    });
    return this.repo.save(row);
  }

  async findAll(q: QueryProgressPhotosDto) {
    const where: any = { gymId: q.gymId };
    if (q.clientId) where.clientId = q.clientId;

    if (q.dateFrom && q.dateTo) {
      where.takenAt = Between(new Date(q.dateFrom), new Date(q.dateTo));
    } else if (q.dateFrom) {
      where.takenAt = MoreThanOrEqual(new Date(q.dateFrom));
    } else if (q.dateTo) {
      where.takenAt = LessThanOrEqual(new Date(q.dateTo));
    }

    const [data, total] = await this.repo.findAndCount({
      where,
      order: { takenAt: 'DESC' },
      withDeleted: false,
      skip: q.offset ?? 0,
      take: q.limit ?? 50,
    });
    return { data, total };
  }

  async remove(id: string, gymId: string) {
    const row = await this.repo.findOne({ where: { id, gymId } });
    if (!row) throw new NotFoundException('Foto no encontrada');
    await this.repo.softDelete({ id, gymId });
    return { ok: true };
  }
}
