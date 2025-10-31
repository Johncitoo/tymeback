import 'jest';
import { Test } from '@nestjs/testing';
import { INestApplication, CanActivate, ExecutionContext } from '@nestjs/common';
import request from 'supertest';
import { AppointmentsModule } from '../../src/appointments/appointments.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Appointment } from '../../src/appointments/entities/appointment.entity';
import { StaffAvailability } from '../../src/appointments/entities/staff-availability.entity';
import { StaffTimeOff } from '../../src/appointments/entities/staff-time-off.entity';
import { User, RoleEnum } from '../../src/users/entities/user.entity';
import { Membership } from '../../src/memberships/entities/membership.entity';
import { GymHour } from '../../src/gym-hours/entities/gym-hour.entity';
import { GymHourOverride } from '../../src/gym-hours/entities/gym-hour-override.entity';
import { createMockRepo } from '../utils/mock-repo';

class PassAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    req.user = { sub: 'test-user', role: RoleEnum.ADMIN, gymId: '00000000-0000-0000-0000-000000000001' };
    return true;
  }
}

describe('AppointmentsController (e2e)', () => {
  let app: INestApplication;

  const gymId = '00000000-0000-0000-0000-000000000001';
  const clientId = '00000000-0000-0000-0000-000000000301';
  const trainerId = '00000000-0000-0000-0000-000000000201';

  const repo = createMockRepo<Appointment>();
  const availRepo = createMockRepo<StaffAvailability>();
  const offRepo = createMockRepo<StaffTimeOff>();
  const usersRepo = createMockRepo<User>();
  const memRepo = createMockRepo<Membership>();
  const hoursRepo = createMockRepo<GymHour>();
  const ovRepo = createMockRepo<GymHourOverride>();

  const membershipsService = {
    getActiveForClient: jest.fn(),
    useSessions: jest.fn(),
  };

  beforeAll(async () => {
    usersRepo.findOne.mockImplementation(({ where: { id, gymId: g } }: any) => {
      if (g !== gymId) return Promise.resolve(null);
      if (id === clientId) return Promise.resolve({ id, gymId: g, role: RoleEnum.CLIENT });
      if (id === trainerId) return Promise.resolve({ id, gymId: g, role: RoleEnum.TRAINER });
      return Promise.resolve(null);
    });

    hoursRepo.findOne.mockResolvedValue({
      gymId, dayOfWeek: 0, isOpen: true, openTime: '07:00', closeTime: '21:00',
    });
    ovRepo.findOne.mockResolvedValue(null);
    offRepo.find.mockResolvedValue([]);
    availRepo.find.mockResolvedValue([
      { gymId, staffId: trainerId, weekday: 0, isAvailable: true, startTime: '09:00', endTime: '20:00' },
    ]);
    repo.find.mockResolvedValue([]);

    const moduleRef = await Test.createTestingModule({
      imports: [AppointmentsModule],
    })
      // Override repos
      .overrideProvider(getRepositoryToken(Appointment)).useValue(repo)
      .overrideProvider(getRepositoryToken(StaffAvailability)).useValue(availRepo)
      .overrideProvider(getRepositoryToken(StaffTimeOff)).useValue(offRepo)
      .overrideProvider(getRepositoryToken(User)).useValue(usersRepo)
      .overrideProvider(getRepositoryToken(Membership)).useValue(memRepo)
      .overrideProvider(getRepositoryToken(GymHour)).useValue(hoursRepo)
      .overrideProvider(getRepositoryToken(GymHourOverride)).useValue(ovRepo)
      // Override service de memberships (inyectado en AppointmentsService)
      .overrideProvider('MembershipsService').useValue(membershipsService as any)
      // Bypass guards globalmente
      .compile();

    app = moduleRef.createNestApplication();
    app.useGlobalGuards(new PassAuthGuard());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/api/appointments (POST) crea cita', async () => {
    const dto = {
      gymId,
      type: 'TRAINING',
      clientId,
      staffId: trainerId,
      startAt: '2025-10-31T10:00:00-03:00',
      endAt: '2025-10-31T11:00:00-03:00',
      createdByUserId: trainerId,
    };

    const created = { id: 'ap-100', ...dto, status: 'BOOKED' };
    repo.create.mockReturnValue(created);
    repo.save.mockResolvedValue(created);

    const res = await request(app.getHttpServer())
      .post('/api/appointments')
      .send(dto)
      .expect(201);

    expect(res.body.id).toBe('ap-100');
    expect(res.body.status).toBe('BOOKED');
  });
});
