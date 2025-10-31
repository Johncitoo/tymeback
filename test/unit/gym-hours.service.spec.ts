import 'jest';
import { GymHoursService } from '../../src/gym-hours/gym-hours.service';
import { GymHour } from '../../src/gym-hours/entities/gym-hour.entity';
import { GymHourOverride } from '../../src/gym-hours/entities/gym-hour-override.entity';
import { User, RoleEnum } from '../../src/users/entities/user.entity';
import { createMockRepo, MockRepo } from '../utils/mock-repo';

describe('GymHoursService (unit)', () => {
  let service: GymHoursService;
  let hoursRepo: MockRepo<GymHour>;
  let ovRepo: MockRepo<GymHourOverride>;
  let usersRepo: MockRepo<User>;
  const gymId = '00000000-0000-0000-0000-000000000001';
  const adminId = '00000000-0000-0000-0000-000000000101';

  beforeEach(() => {
    hoursRepo = createMockRepo();
    ovRepo = createMockRepo();
    usersRepo = createMockRepo({
      findOne: jest.fn(({ where: { id, gymId: g } }: any) =>
        Promise.resolve(id === adminId && g === gymId ? { id, gymId: g, role: RoleEnum.ADMIN } : null)
      ),
    });

    service = new GymHoursService(hoursRepo as any, ovRepo as any, usersRepo as any);
  });

  it('crea override de día cerrado', async () => {
    ovRepo.findOne.mockResolvedValue(null);
    ovRepo.save.mockImplementation((x) => Promise.resolve({ id: 'ov-1', ...x }));

    const dto = {
      gymId,
      date: '2025-12-25',
      isClosed: true,
      byUserId: adminId,
    };
    const res = await service.createOverride(dto as any);
    expect(res.isClosed).toBe(true);
    expect(res.openTime).toBeNull();
    expect(res.closeTime).toBeNull();
  });

  it('resolve usa override si existe, si no usa weekly', async () => {
    // 1) override (cerrado)
    ovRepo.findOne.mockResolvedValueOnce({
      gymId, date: '2025-10-31', isOpen: false, openTime: null, closeTime: null, note: 'Feriado',
    });
    let r = await service.resolve({ gymId, date: '2025-10-31' } as any);
    expect(r.source).toBe('override');
    expect(r.isClosed).toBe(true);

    // 2) weekly (abierto)
    ovRepo.findOne.mockResolvedValueOnce(null);
    hoursRepo.findOne.mockResolvedValue({
      gymId, dayOfWeek: 4, isOpen: true, openTime: '07:00', closeTime: '21:00',
    });
    r = await service.resolve({ gymId, date: '2025-10-31' } as any);
    expect(r.source).toBe('weekly');
    expect(r.isClosed).toBe(false);
  });
});
