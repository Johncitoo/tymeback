/* Utilidad simple para mockear Repository<T> de TypeORM */
export type MockRepo<T = any> = {
  find: jest.Mock;
  findOne: jest.Mock;
  findAndCount: jest.Mock;
  save: jest.Mock;
  remove: jest.Mock;
  create: jest.Mock;
  createQueryBuilder?: jest.Mock;
};

export function createMockRepo<T = any>(defaults?: Partial<MockRepo<T>>): MockRepo<T> {
  return {
    find: jest.fn(),
    findOne: jest.fn(),
    findAndCount: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
    create: jest.fn((x) => x),
    createQueryBuilder: jest.fn(),
    ...(defaults || {}),
  };
}
