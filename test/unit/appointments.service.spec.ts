import 'jest';
import { AppointmentsService } from '../../src/appointments/appointments.service';
import { Appointment, AppointmentStatusEnum, AppointmentTypeEnum } from '../../src/appointments/entities/appointment.entity';
import { StaffAvailability } from '../../src/appointments/entities/staff-availability.entity';
import { StaffTimeOff } from '../../src/appointments/entities/staff-time-off.entity';
import { User, RoleEnum } from '../../src/users/entities/user.entity';
import { Membership } from '../../src/memberships/entities/membership.entity';
import { GymHour } from '../../src/gym-hours/entities/gym-hour.entity';
import { GymHourOverride } from '../../src/gym-hours/entities/gym-hour-override.entity';
import { createMockRepo, MockRepo } from '../utils/mock-repo';

describe('AppointmentsService (unit)', () => {
  let service: AppointmentsService;

  // repos
  let repo: MockRepo<Appointment>;
  let availRepo: MockRepo<StaffAvailability>;
  let offRepo: MockRepo<StaffTimeOff>;
  let usersRepo: MockRepo<User>;
  let memRepo: MockRepo<Membership>;
  let hoursRepo: MockRepo<GymHour>;
  let ovRepo: MockRepo<GymHourOverride>;
  // membershipsService mock
  const membershipsService = {
    getActiveForClient: jest.fn(),
    useSessions: jest.fn(),
  };

  const baseGym = '00000000-0000-0000-0000-000000000001';
  const clientId = '00000000-0000-0000-0000-000000000301';
  const trainerId = '00000000-0000-0000-0000-000000000201';

  beforeEach(() => {
    repo = createMockRepo();
    availRepo = createMockRepo();
    offRepo = createMockRepo();
    usersRepo = createMockRepo();
    memRepo = createMockRepo();
    hoursRepo = createMockRepo();
    ovRepo = createMockRepo();

    // Usuarios válidos
    usersRepo.findOne
      .mockImplementation(({ where: { id, gymId } }: any) => {
        if (gymId !== baseGym) return Promise.resolve(null);
        if (id === clientId) return Promise.resolve({ id, gymId, role: RoleEnum.CLIENT });
        if (id === trainerId) return Promise.resolve({ id, gymId, role: RoleEnum.TRAINER });
        return Promise.resolve(null);
      });

    // Horario semanal abierto 07:00–21:00 (0=lun..6=dom según servicio)
    hoursRepo.findOne.mockResolvedValue({
      gymId: baseGym, dayOfWeek: 0, isOpen: true, openTime: '07:00', closeTime: '21:00',
    });

    // Sin override y sin ausencias
    ovRepo.findOne.mockResolvedValue(null);
    offRepo.find.mockResolvedValue([]);

    // Disponibilidad de staff cubre 09:00–20:00
    availRepo.find.mockResolvedValue([
      { gymId: baseGym, staffId: trainerId, weekday: 0, isAvailable: true, startTime: '09:00', endTime: '20:00' },
    ]);

    // Sin conflictos
    repo.find.mockResolvedValue([]);

    service = new AppointmentsService(
      repo as any, availRepo as any, offRepo as any, usersRepo as any,
      memRepo as any, hoursRepo as any, ovRepo as any, membershipsService as any,
    );
  });

  it('crea una cita TRAINING válida dentro del horario y disponibilidad', async () => {
    const dto = {
      gymId: baseGym,
      type: AppointmentTypeEnum.TRAINING,
      clientId,
      staffId: trainerId,
      startAt: '2025-10-31T10:00:00-03:00',
      endAt: '2025-10-31T11:00:00-03:00',
      createdByUserId: trainerId,
    };

    const created = { id: 'ap-1', ...dto, status: AppointmentStatusEnum.BOOKED };
    repo.create.mockReturnValue(created);
    repo.save.mockResolvedValue(created);

    const res = await service.create(dto as any);
    expect(repo.create).toHaveBeenCalled();
    expect(repo.save).toHaveBeenCalled();
    expect(res.status).toBe(AppointmentStatusEnum.BOOKED);
  });

  it('reprograma una cita, deja status CONFIRMED y mantiene vínculos', async () => {
    const id = 'ap-2';
    const base = {
      id,
      gymId: baseGym,
      type: AppointmentTypeEnum.TRAINING,
      clientId,
      staffId: trainerId,
      startAt: new Date('2025-10-31T10:00:00-03:00'),
      endAt: new Date('2025-10-31T11:00:00-03:00'),
      status: AppointmentStatusEnum.BOOKED,
      requiresSession: false,
      membershipId: null,
      createdByUserId: trainerId,
      canceledByUserId: null,
      cancelReason: null,
      rescheduledFromId: null,
      notes: null,
    };

    repo.findOne.mockResolvedValue({ ...base });
    repo.save.mockImplementation((x) => Promise.resolve(x));

    const dto = {
      gymId: baseGym,
      newStartAt: '2025-10-31T12:00:00-03:00',
      newEndAt: '2025-10-31T13:00:00-03:00',
      reason: 'Cliente pidió más tarde',
    };

    const res = await service.reschedule(id, dto as any);
    expect(res.status).toBe(AppointmentStatusEnum.CONFIRMED);
    expect(res.rescheduledFromId).toBe(id);
  });

  it('cancela una cita', async () => {
    const id = 'ap-3';
    const base = {
      id,
      gymId: baseGym,
      type: AppointmentTypeEnum.TRAINING,
      clientId,
      staffId: trainerId,
      startAt: new Date('2025-10-31T10:00:00-03:00'),
      endAt: new Date('2025-10-31T11:00:00-03:00'),
      status: AppointmentStatusEnum.BOOKED,
      createdByUserId: trainerId,
    };
    repo.findOne.mockResolvedValue(base);
    repo.save.mockImplementation((x) => Promise.resolve(x));

    const res = await service.cancel(id, { gymId: baseGym, byUserId: trainerId, reason: 'Llueve' } as any);
    expect(res.status).toBe(AppointmentStatusEnum.CANCELED);
    expect(res.cancelReason).toBe('Llueve');
  });

  it('completa cita y consume sesión si requiresSession=true', async () => {
    const id = 'ap-4';
    const base = {
      id,
      gymId: baseGym,
      type: AppointmentTypeEnum.TRAINING,
      clientId,
      staffId: trainerId,
      startAt: new Date('2025-10-31T10:00:00-03:00'),
      endAt: new Date('2025-10-31T11:00:00-03:00'),
      status: AppointmentStatusEnum.BOOKED,
      requiresSession: true,
      membershipId: null,
      createdByUserId: trainerId,
    };
    repo.findOne.mockResolvedValue(base);
    repo.save.mockImplementation((x) => Promise.resolve(x));

    membershipsService.getActiveForClient.mockResolvedValue({ id: 'm-1', gymId: baseGym });
    membershipsService.useSessions.mockResolvedValue({ ok: true });

    const res = await service.complete(id, { gymId: baseGym } as any);
    expect(res.status).toBe(AppointmentStatusEnum.COMPLETED);
    expect(membershipsService.getActiveForClient).toHaveBeenCalled();
    expect(membershipsService.useSessions).toHaveBeenCalledWith('m-1', expect.any(Object));
  });
});
