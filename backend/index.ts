import {
  router,
  json,
  error,
  requireAuth,
  requireAdminEmailAllowlist,
  db,
} from '@appdeploy/sdk';
const ADMIN_EMAILS = ['johncharlessarwi@gmail.com'];
type Role = 'student' | 'lecturer' | 'administrator' | 'super_admin';
type UserRecord = {
  userId: string;
  email?: string;
  name?: string;
  role: Role;
  createdAt: number;
  updatedAt: number;
};
type SessionRecord = {
  course: string;
  location: string;
  code: string;
  createdBy: string;
  startsAt: number;
  expiresAt: number;
  status: string;
};
type AttendanceRecord = {
  sessionId: string;
  studentId: string;
  course: string;
  checkedInAt: number;
  status: string;
};
const now = () => Date.now();
const clean = (v: unknown, n = 120) =>
  typeof v === 'string' ? v.trim().slice(0, n) : '';
const makeCode = () => Math.random().toString(36).slice(2, 8).toUpperCase();
const isRole = (v: unknown): v is Role =>
  ['student', 'lecturer', 'administrator', 'super_admin'].includes(String(v));
async function profileFor(user: {
  userId: string;
  email?: string;
  name?: string;
}): Promise<UserRecord> {
  const [saved] = await db.get<UserRecord>('afams_users', [user.userId], {
    consistent: true,
  });
  if (saved) return saved;
  const owner = Boolean(
    user.email && ADMIN_EMAILS.includes(user.email.toLowerCase())
  );
  const record: UserRecord = {
    userId: user.userId,
    email: user.email,
    name: user.name || user.email?.split('@')[0] || 'Campus user',
    role: owner ? 'super_admin' : 'student',
    createdAt: now(),
    updatedAt: now(),
  };
  const [id] = await db.tx.add('afams_users', [{ id: user.userId, ...record }]);
  if (id) return record;
  const [raced] = await db.get<UserRecord>('afams_users', [user.userId], {
    consistent: true,
  });
  if (raced) return raced;
  throw new Error('Could not initialize account profile.');
}
async function roleGuard(ctx: any, allowed: Role[]) {
  const p = await profileFor(ctx.user);
  return allowed.includes(p.role)
    ? null
    : error('Your account role does not permit this action.', 403);
}
async function audit(actorId: string, action: string, detail: string) {
  await db.add('afams_audit', [{ actorId, action, detail, createdAt: now() }]);
}
export const handler = router({
  'GET /api/_healthcheck': [
    async () => json({ ok: true, service: 'AFAMS API', time: now() }),
  ],
  'GET /api/me': [
    requireAuth(),
    async ({ user }) => {
      try {
        return json({ profile: await profileFor(user!) });
      } catch (e) {
        return error(
          e instanceof Error ? e.message : 'Profile unavailable.',
          500
        );
      }
    },
  ],
  'GET /api/dashboard': [
    requireAuth(),
    async ({ user }) => {
      try {
        const p = await profileFor(user!);
        const [sp, ap, lp] = await Promise.all([
          db.list<SessionRecord & { id: string }>('afams_sessions', {
            limit: 100,
          }),
          db.list<AttendanceRecord & { id: string }>('afams_attendance', {
            limit: 200,
          }),
          p.role === 'super_admin' || p.role === 'administrator'
            ? db.list<
                {
                  actorId: string;
                  action: string;
                  detail: string;
                  createdAt: number;
                } & { id: string }
              >('afams_audit', { limit: 60 })
            : Promise.resolve({
                items: [] as Array<{
                  id: string;
                  actorId: string;
                  action: string;
                  detail: string;
                  createdAt: number;
                }>,
              }),
        ]);
        const sessions =
          p.role === 'student'
            ? sp.items.filter(
                s => s.status === 'active' || s.createdBy === p.userId
              )
            : p.role === 'lecturer'
              ? sp.items.filter(s => s.createdBy === p.userId)
              : sp.items;
        const attendance =
          p.role === 'student'
            ? ap.items.filter(a => a.studentId === p.userId)
            : p.role === 'lecturer'
              ? ap.items.filter(a => sessions.some(s => s.id === a.sessionId))
              : ap.items;
        const active = sessions.filter(
          s => s.status === 'active' && s.expiresAt > now()
        );
        return json({
          profile: p,
          stats: {
            sessions: sessions.length,
            attendance: attendance.length,
            activeSessions: active.length,
            attendanceRate: sessions.length
              ? Math.min(
                  100,
                  Math.round((attendance.length / sessions.length) * 100)
                )
              : 0,
          },
          sessions: sessions
            .sort((a, b) => b.startsAt - a.startsAt)
            .slice(0, 30),
          attendance: attendance
            .sort((a, b) => b.checkedInAt - a.checkedInAt)
            .slice(0, 50),
          audit: lp.items
            .sort((a, b) => b.createdAt - a.createdAt)
            .slice(0, 30),
        });
      } catch (e) {
        return error(
          e instanceof Error ? e.message : 'Dashboard unavailable.',
          500
        );
      }
    },
  ],
  'GET /api/sessions': [
    requireAuth(),
    async ({ user }) => {
      const p = await profileFor(user!);
      const r = await db.list<SessionRecord & { id: string }>(
        'afams_sessions',
        { limit: 100 }
      );
      return json({
        sessions: r.items
          .filter(s => s.createdBy === p.userId || s.status === 'active')
          .slice(0, 40),
      });
    },
  ],
  'POST /api/sessions': [
    requireAuth(),
    async ctx => {
      const denied = await roleGuard(ctx, [
        'lecturer',
        'administrator',
        'super_admin',
      ]);
      if (denied) return denied;
      const b = (ctx.body || {}) as Record<string, unknown>,
        course = clean(b.course, 100),
        location = clean(b.location, 100),
        duration = Number(b.durationMinutes);
      if (course.length < 2)
        return error('Enter a valid course or class name.', 400);
      if (!Number.isInteger(duration) || duration < 5 || duration > 180)
        return error('Duration must be between 5 and 180 minutes.', 400);
      const p = await profileFor(ctx.user!),
        startsAt = now(),
        session = {
          course,
          location,
          code: makeCode(),
          createdBy: p.userId,
          startsAt,
          expiresAt: startsAt + duration * 60000,
          status: 'active',
        };
      const [id] = await db.add('afams_sessions', [session]);
      if (!id) return error('Could not create session. Retry.', 503);
      await audit(p.userId, 'Attendance session created', course + ' · ' + id);
      return json({ session: { id, ...session } }, 201);
    },
  ],
  'POST /api/check-in': [
    requireAuth(),
    async ctx => {
      const b = (ctx.body || {}) as Record<string, unknown>,
        code = clean(b.code, 8).toUpperCase();
      if (!/^[A-Z0-9]{6}$/.test(code))
        return error('Enter the six-character session code.', 400);
      const p = await profileFor(ctx.user!),
        page = await db.list<SessionRecord & { id: string }>('afams_sessions', {
          limit: 100,
        }),
        s = page.items.find(x => x.code === code);
      if (!s) return error('Session code was not found.', 404);
      if (s.status !== 'active' || s.expiresAt <= now())
        return error('This session has expired.', 410);
      if (s.createdBy === p.userId)
        return error(
          'Session owners cannot check in to their own session.',
          403
        );
      const id = s.id + '_' + p.userId,
        [existing] = await db.get<AttendanceRecord>('afams_attendance', [id], {
          consistent: true,
        });
      if (existing)
        return error('You have already checked in to this session.', 409);
      const record: AttendanceRecord = {
        sessionId: s.id,
        studentId: p.userId,
        course: s.course,
        checkedInAt: now(),
        status: 'Verified',
      };
      const [created] = await db.tx.add('afams_attendance', [
        { id, ...record },
      ]);
      if (!created)
        return error(
          'Attendance already exists or could not be recorded.',
          409
        );
      await audit(p.userId, 'Attendance check-in', s.course + ' · ' + s.id);
      return json(
        {
          ok: true,
          message: 'Attendance recorded for ' + s.course + '.',
          attendance: { id, ...record },
        },
        201
      );
    },
  ],
  'POST /api/admin/roles': [
    requireAuth(),
    requireAdminEmailAllowlist(ADMIN_EMAILS),
    async ({ body, user }) => {
      const b = (body || {}) as Record<string, unknown>,
        userId = clean(b.userId, 80),
        role = b.role;
      if (!userId || !isRole(role) || role === 'super_admin')
        return error('Provide a valid account ID and non-owner role.', 400);
      const [target] = await db.get<UserRecord>('afams_users', [userId], {
        consistent: true,
      });
      if (!target)
        return error('Account not found. Ask the user to sign in first.', 404);
      const [ok] = await db.tx.update(
        'afams_users',
        [
          {
            id: userId,
            record: { role, updatedAt: now() },
            if: { role: target.role },
          },
        ],
        { patch: true }
      );
      if (!ok)
        return error('Role changed concurrently. Refresh and retry.', 409);
      await audit(user!.userId, 'Account role updated', userId + ' → ' + role);
      return json({ ok: true, userId, role });
    },
  ],
  'GET /api/admin/audit': [
    requireAuth(),
    requireAdminEmailAllowlist(ADMIN_EMAILS),
    async () => {
      const r = await db.list('afams_audit', { limit: 100 });
      return json({
        events: r.items.sort((a, b) => b.createdAt - a.createdAt),
      });
    },
  ],
});
