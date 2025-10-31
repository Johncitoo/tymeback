import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, LessThanOrEqual, MoreThanOrEqual, Repository } from 'typeorm';
import { InbodyScan } from './entities/inbody-scan.entity';
import { CreateInbodyScanDto } from './dto/create-inbody-scan.dto';
import { UpdateInbodyScanDto } from './dto/update-inbody-scan.dto';
import { QueryInbodyScansDto } from './dto/query-inbody-scans.dto';
import { User, RoleEnum } from '../users/entities/user.entity';

@Injectable()
export class InbodyScansService {
  constructor(
    @InjectRepository(InbodyScan)
    private readonly repo: Repository<InbodyScan>,
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
  ) {}

  private async assertGymUser(userId: string, gymId: string): Promise<User> {
    const u = await this.usersRepo.findOne({ where: { id: userId, gymId } });
    if (!u) throw new NotFoundException('Usuario no pertenece al gimnasio');
    return u;
  }

  private async assertClient(clientId: string, gymId: string): Promise<User> {
    const u = await this.assertGymUser(clientId, gymId);
    if (u.role !== RoleEnum.CLIENT) throw new BadRequestException('No es cliente');
    return u;
  }

  private async assertNutriOrAdmin(userId: string, gymId: string): Promise<User> {
    const u = await this.assertGymUser(userId, gymId);
    if (u.role !== RoleEnum.NUTRITIONIST && u.role !== RoleEnum.ADMIN) {
      throw new ForbiddenException('Requiere rol NUTRITIONIST o ADMIN');
    }
    return u;
  }

  // ---- CREATE ----
  async create(dto: CreateInbodyScanDto) {
    await this.assertClient(dto.clientId, dto.gymId);
    const author = await this.assertNutriOrAdmin(dto.createdByUserId, dto.gymId);

    const nutritionistId =
      dto.nutritionistId ?? (author.role === RoleEnum.NUTRITIONIST ? author.id : null);

    const row = this.repo.create({
      gymId: dto.gymId,
      clientId: dto.clientId,
      nutritionistId,
      scanDate: dto.scanDate ? new Date(dto.scanDate) : new Date(),
      data: dto.data ?? null,
      fileId: dto.fileId ?? null,
      pdfUrl: dto.pdfUrl ?? null,
      notes: dto.notes ?? null,
    });
    return this.repo.save(row);
  }

  // ---- UPDATE ----
  async update(id: string, dto: UpdateInbodyScanDto) {
    const row = await this.repo.findOne({ where: { id, gymId: dto.gymId } });
    if (!row) throw new NotFoundException('InBody no encontrado');

    await this.assertNutriOrAdmin(dto.updatedByUserId, dto.gymId);

    if (dto.scanDate !== undefined) row.scanDate = new Date(dto.scanDate);
    if (dto.data !== undefined) row.data = dto.data;
    if (dto.fileId !== undefined) row.fileId = dto.fileId ?? null;
    if (dto.pdfUrl !== undefined) row.pdfUrl = dto.pdfUrl ?? null;
    if (dto.notes !== undefined) row.notes = dto.notes;

    return this.repo.save(row);
  }

  // ---- LIST ----
  async findAll(q: QueryInbodyScansDto) {
    const where: any = { gymId: q.gymId };
    if (q.clientId) where.clientId = q.clientId;
    if (q.nutritionistId) where.nutritionistId = q.nutritionistId;

    if (q.dateFrom && q.dateTo) {
      where.scanDate = Between(new Date(q.dateFrom), new Date(q.dateTo));
    } else if (q.dateFrom) {
      where.scanDate = MoreThanOrEqual(new Date(q.dateFrom));
    } else if (q.dateTo) {
      where.scanDate = LessThanOrEqual(new Date(q.dateTo));
    }

    const [data, total] = await this.repo.findAndCount({
      where,
      order: { scanDate: 'DESC' },
      skip: q.offset ?? 0,
      take: q.limit ?? 20,
    });

    return { data, total };
  }

  // ---- GET ONE ----
  async findOne(id: string, gymId: string) {
    const row = await this.repo.findOne({ where: { id, gymId } });
    if (!row) throw new NotFoundException('InBody no encontrado');
    return row;
  }

  // ---- DELETE (hard) ----
  async remove(id: string, gymId: string, byUserId: string) {
    await this.assertNutriOrAdmin(byUserId, gymId);
    const row = await this.repo.findOne({ where: { id, gymId } });
    if (!row) throw new NotFoundException('InBody no encontrado');
    await this.repo.remove(row);
    return { ok: true };
  }
}
