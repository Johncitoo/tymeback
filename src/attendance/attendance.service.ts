import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, IsNull } from 'typeorm';
import { Attendance } from './entities/attendance.entity';
import { CheckInDto } from './dto/check-in.dto';
import { CheckOutDto } from './dto/check-out.dto';
import { QueryAttendanceDto } from './dto/query-attendance.dto';
import { User, RoleEnum } from '../users/entities/user.entity';
import { GymUser } from '../gym-users/entities/gym-user.entity';

@Injectable()
export class AttendanceService {
  constructor(
    @InjectRepository(Attendance) private readonly repo: Repository<Attendance>,
    @InjectRepository(User) private readonly usersRepo: Repository<User>,
    @InjectRepository(GymUser) private readonly gymUsersRepo: Repository<GymUser>,
  ) {}

  private async assertUserInGym(userId: string, gymId: string) {
    // Validar membership via gym_users
    const gymUser = await this.gymUsersRepo.findOne({
      where: { userId, gymId },
    });
    if (!gymUser) throw new NotFoundException('Usuario no pertenece al gimnasio');

    // Obtener user
    const u = await this.usersRepo.findOne({ where: { id: userId } });
    if (!u) throw new NotFoundException('Usuario no encontrado');

    // Retornar user con role del gym_user
    return { ...u, role: gymUser.role };
  }

  async checkIn(dto: CheckInDto) {
    const by = await this.assertUserInGym(dto.byUserId, dto.gymId);
    const client = await this.assertUserInGym(dto.clientId, dto.gymId);
    if (client.role !== RoleEnum.CLIENT) throw new BadRequestException('clientId debe ser CLIENT');

    if (by.role === RoleEnum.CLIENT && by.id !== client.id) {
      throw new ForbiddenException('CLIENT solo puede hacer check-in para sí mismo');
    }

    // Evitar duplicados abiertos para el mismo cliente
    const open = await this.repo.findOne({ where: { clientGymUserId: dto.clientId, checkOutAt: IsNull() } });
    if (open) throw new BadRequestException('El cliente ya tiene una asistencia abierta');

    const row = this.repo.create({
      gymId: dto.gymId,
      clientGymUserId: dto.clientId,
      checkInAt: new Date(),
      checkOutAt: null,
    });
    return this.repo.save(row);
  }

  async checkOut(id: string, dto: CheckOutDto) {
    const by = await this.assertUserInGym(dto.byUserId, dto.gymId);
    const row = await this.repo.findOne({ where: { id } });
    if (!row) throw new NotFoundException('Asistencia no encontrada');
    if (row.checkOutAt) return row;

    if (by.role === RoleEnum.CLIENT && by.id !== row.clientGymUserId) {
      throw new ForbiddenException('CLIENT solo puede hacer check-out de su propia asistencia');
    }

    row.checkOutAt = new Date();
    return this.repo.save(row);
  }

  async list(q: QueryAttendanceDto) {
    // Note: attendance now has gym_id
    const where: any = {};
    if (q.clientId) where.clientGymUserId = q.clientId;
    if (q.openOnly === 'true') where.checkOutAt = IsNull();
    if (q.from && q.to) where.checkInAt = Between(new Date(q.from), new Date(q.to));

    const [data, total] = await this.repo.findAndCount({
      where,
      order: { checkInAt: 'DESC' },
      skip: q.offset ?? 0,
      take: q.limit ?? 20,
    });
    return { data, total };
  }
}
