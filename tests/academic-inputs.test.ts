import { beforeEach, describe, expect, it, vi } from 'vitest';
import { handler } from '../backend/index';

const db = vi.hoisted(() => ({
  get: vi.fn(),
  list: vi.fn(),
  add: vi.fn(),
  delete: vi.fn(),
  tx: { add: vi.fn() },
}));

vi.mock('@appdeploy/sdk', () => ({
  router: (routes: unknown) => routes,
  json: (body: unknown, status = 200) => ({ body, status }),
  error: (error: string, status: number) => ({ body: { error }, status }),
  requireAuth: () => () => undefined,
  requireAdminEmailAllowlist: () => () => undefined,
  db,
  ai: {},
}));

const user = { userId: 'test-admin', email: 'admin@example.test' };
type Context = { user: typeof user; body?: object; params?: object };
const routes = handler as unknown as Record<string, [unknown, (ctx: Context) => Promise<{ status: number }>]>;
const create = (body: object) => routes['POST /api/academic'][1]({ user, body });
const remove = (kind: unknown) => routes['DELETE /api/academic/:kind/:id'][1]({ user, params: { kind, id: 'test-record' } });

beforeEach(() => {
  vi.resetAllMocks();
  db.get.mockImplementation(async table => table === 'afams_users' ? [{ ...user, role: 'administrator' }] : [{ status: 'active' }]);
  db.list.mockResolvedValue({ items: [] });
  db.tx.add.mockResolvedValue(['test-record']);
  db.delete.mockResolvedValue(['test-record']);
});

describe('academic record input boundaries', () => {
  it.each(['toString', 'not-a-kind', 'courses ', ['courses']])('rejects unsupported kinds before changing records (%j)', async kind => {
    expect(await create({ kind, name: 'Example' })).toHaveProperty('status', 400);
    expect(await remove(kind)).toHaveProperty('status', 400);
    expect(db.tx.add).not.toHaveBeenCalled();
    expect(db.delete).not.toHaveBeenCalled();
  });

  it('looks up known record kinds without changing the table mapping', async () => {
    expect(await create({ kind: 'faculties', name: 'Example' })).toHaveProperty('status', 201);
    expect(db.tx.add).toHaveBeenCalledWith('afams_faculties', expect.any(Array));
    expect(await remove('faculties')).toHaveProperty('status', 200);
    expect(db.delete).toHaveBeenCalledWith('afams_faculties', ['test-record']);
  });

  it.each(['2026-02-30', '2026-02-10T00:00:00Z', ' 2026-02-10', null])('rejects a noncanonical calendar date (%j)', async startDate => {
    const dates = { name: 'Academic period', startDate, endDate: '2026-12-31' };
    expect(await create({ ...dates, kind: 'academicYears' })).toHaveProperty('status', 400);
    expect(await create({ ...dates, kind: 'semesters' })).toHaveProperty('status', 400);
    expect(db.tx.add).not.toHaveBeenCalled();
  });

  it('accepts a real leap date in an ordered date range', async () => {
    expect(await create({ kind: 'semesters', name: 'Leap term', startDate: '2028-02-29', endDate: '2028-06-01' })).toHaveProperty('status', 201);
  });

  it.each([true, '45', 12.5, 0, 5001])('rejects an invalid classroom capacity (%j)', async capacity => {
    expect(await create({ kind: 'classrooms', name: 'Room 1', campusId: 'campus-1', capacity })).toHaveProperty('status', 400);
    expect(db.tx.add).not.toHaveBeenCalled();
  });

  it('accepts a numeric classroom capacity', async () => {
    expect(await create({ kind: 'classrooms', name: 'Room 1', campusId: 'campus-1', capacity: 45 })).toHaveProperty('status', 201);
    expect(db.tx.add).toHaveBeenCalledWith('afams_classrooms', [expect.objectContaining({ capacity: 45 })]);
  });
});
