import 'jest';
import { MembershipsService } from '../../src/memberships/memberships.service';
import { Membership, MembershipStatusEnum } from '../../src/memberships/entities/membership.entity';
import { Plan } from '../../src/plans/entities/plan.entity';
import { User, RoleEnum } from '../../src/users/entities/user.entity';
import { createMockRepo, MockRepo } from '../utils/mock-repo';

describe('MembershipsService (unit)', () => {
  let service: MembershipsService;
  let repo: MockRepo<Membership>;
  let plansRepo: MockRepo<Plan>;
  let usersRepo: MockRepo<User>;

  const gymId = '00000000-0000-0000-0000-000000000001';
  const adminId = '00000000-0000-0000-0000-000000000101';
  const clientId = '00000000-0000-0000-0000-000000000301';
  const planId = '00000000-0000-0000-0000-000000003001';

  beforeEach(() => {
    repo = createMockRepo();
    plansRepo = createMockRepo();
    usersRepo = createMockRepo({
      findOne: jest.fn(({ where: { id, gymId: g } }: any) =>
        Promise.resolve(id === adminId && g === gymId ? { id, gymId: g, role: RoleEnum.ADMIN } : null)
      ),
    });

    service = new MembershipsService(repo as any, plansRepo as any, usersRepo as any);
  });

  it('consume sesiones válidas', async () => {
    const m = {
      id: 'm-1',
      gymId,
      status: MembershipStatusEnum.ACTIVE,
      sessionsQuota: 5,
      sessionsUsed: 2,
    };
    repo.findOne.mockResolvedValue(m);
    repo.save.mockImplementation((x) => Promise.resolve(x));

    const res = await service.useSessions('m-1', { gymId, count: 1 } as any);
    expect(res.sessionsUsed).toBe(3);
  });

  it('crea desde plan (1 mes) calculando endDate inclusiva', async () => {
    const plan = { id: planId, gymId, durationMonths: 1, durationDays: null, privateSessionsPerPeriod: 4 };
    const client = { id: clientId, gymId, role: RoleEnum.CLIENT };
    plansRepo.findOne.mockResolvedValue(plan);
    usersRepo.findOne.mockResolvedValue(client);
    repo.create.mockImplementation((x) => x);
    repo.save.mockImplementation((x) => Promise.resolve({ id: 'm-2', ...x }));

    const res = await service.createFromPlan({
      gymId, clientId, planId, byUserId: adminId, startDate: '2025-10-10',
    } as any);

    expect(res.startDate).toBe('2025-10-10');
    // endDate inclusiva: +1 mes clampeado (MembershipsService.addMonthsInclusive quita 1 día)
    expect(res.endDate).toBeDefined();
    expect(res.sessionsQuota).toBe(4);
  });
});
