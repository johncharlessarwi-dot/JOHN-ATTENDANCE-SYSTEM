import {
  router,
  json,
  error,
  requireAuth,
  requireAdminEmailAllowlist,
  db,
  ai,
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
  focusPolicy?: string;
  locationRequired?: boolean;
  latitude?: number;
  longitude?: number;
  radiusMeters?: number;
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
const makeCode = () => {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = new Uint8Array(6);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, byte => alphabet[byte % alphabet.length]).join('');
};
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
            // A valid rate needs enrolled-student and eligible-session denominators.
            // Until those are linked to attendance, do not publish a misleading percentage.
            attendanceRate: null,
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
      const locationRequired = Boolean(b.locationRequired);
      const latitude = Number(b.latitude);
      const longitude = Number(b.longitude);
      const radiusMeters = Math.max(30, Math.min(1000, Number(b.radiusMeters) || 150));
      if (locationRequired && (!Number.isFinite(latitude) || latitude < -90 || latitude > 90 || !Number.isFinite(longitude) || longitude < -180 || longitude > 180))
        return error('Capture a valid classroom location before enabling the geofence.', 400);
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
          focusPolicy: ['strict', 'grace', 'standard'].includes(String(b.focusPolicy)) ? String(b.focusPolicy) : 'standard',
          locationRequired,
          ...(locationRequired ? { latitude, longitude, radiusMeters } : {}),
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
      const latitude = Number(b.latitude);
      const longitude = Number(b.longitude);
      const accuracy = Number(b.accuracy);
      if (s.locationRequired) {
        if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90 || !Number.isFinite(longitude) || longitude < -180 || longitude > 180 || !Number.isFinite(accuracy) || accuracy > 100)
          return error('This session requires a location fix with accuracy of 100 metres or better. Share your current location and retry.', 403);
        const toRadians = (value: number) => value * Math.PI / 180;
        const dLat = toRadians(latitude - Number(s.latitude));
        const dLon = toRadians(longitude - Number(s.longitude));
        const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRadians(Number(s.latitude))) * Math.cos(toRadians(latitude)) * Math.sin(dLon / 2) ** 2;
        const distance = 6371000 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        if (distance > (Number(s.radiusMeters) || 150))
          return error('You are outside the permitted classroom attendance area.', 403);
      }
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
        status: 'Pending Verification',
        ...(s.locationRequired ? { latitude, longitude, accuracyMeters: accuracy, locationVerified: true } : { locationVerified: false }),
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
          message: 'Check-in received for ' + s.course + '. Your lecturer will verify the attendance record.',
          attendance: { id, ...record },
        },
        201
      );
    },
  ],
  'GET /api/attendance/review': [
    requireAuth(),
    async ({ user }) => {
      const p = await profileFor(user!);
      if (!['lecturer', 'administrator', 'super_admin'].includes(p.role))
        return error('You do not have permission to review attendance.', 403);
      const [records, sessions, users] = await Promise.all([
        db.list<any>('afams_attendance', { limit: 500 }),
        db.list<any>('afams_sessions', { limit: 300 }),
        db.list<any>('afams_users', { limit: 500 }),
      ]);
      const sessionMap = new Map(sessions.items.map((s: any) => [s.id, s]));
      const userMap = new Map(users.items.map((u: any) => [u.userId, u]));
      const visible = records.items.filter((record: any) => {
        const session = sessionMap.get(record.sessionId) as any;
        return p.role !== 'lecturer' || session?.createdBy === p.userId;
      }).map((record: any) => {
        const student = userMap.get(record.studentId) as any;
        const session = sessionMap.get(record.sessionId) as any;
        return {
          ...record,
          studentName: student?.name || student?.email || 'Student',
          sessionLocation: session?.location || '',
          reviewedBy: record.reviewedBy || null,
          reviewedAt: record.reviewedAt || null,
        };
      }).sort((a: any, b: any) => b.checkedInAt - a.checkedInAt);
      return json({ attendance: visible });
    },
  ],
  'POST /api/attendance/:id/review': [
    requireAuth(),
    async ctx => {
      const p = await profileFor(ctx.user!);
      if (!['lecturer', 'administrator', 'super_admin'].includes(p.role))
        return error('You do not have permission to review attendance.', 403);
      const id = clean(ctx.params.id, 180);
      const reviewBody = (ctx.body || {}) as Record<string, unknown>;
      const decision = clean(reviewBody.status, 20);
      if (!['Verified', 'Rejected'].includes(decision))
        return error('Choose Verified or Rejected.', 400);
      const [record] = await db.get<any>('afams_attendance', [id], { consistent: true });
      if (!record) return error('Attendance record was not found.', 404);
      const [session] = await db.get<any>('afams_sessions', [record.sessionId], { consistent: true });
      if (!session) return error('Related session was not found.', 404);
      if (p.role === 'lecturer' && session.createdBy !== p.userId)
        return error('You can only review attendance for your own sessions.', 403);
      if (record.status !== 'Pending Verification')
        return error('This attendance record has already been reviewed.', 409);
      const [updated] = await db.tx.update('afams_attendance', [{
        id,
        record: { status: decision, reviewedBy: p.userId, reviewedAt: now() },
        if: { status: 'Pending Verification' },
      }], { patch: true });
      if (!updated) return error('Attendance was reviewed concurrently. Refresh and retry.', 409);
      await audit(p.userId, 'Attendance ' + decision.toLowerCase(), id + ' · ' + record.course);
      return json({ ok: true, status: decision });
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

  'GET /api/academic': [
    requireAuth(),
    async ({ user }) => {
      try {
        const p = await profileFor(user!);
        const [faculties, departments, programmes, courses, semesters, enrollments] = await Promise.all([
          db.list('afams_faculties', { limit: 200 }),
          db.list('afams_departments', { limit: 200 }),
          db.list('afams_programmes', { limit: 200 }),
          db.list('afams_courses', { limit: 200 }),
          db.list('afams_semesters', { limit: 100 }),
          db.list('afams_enrollments', { limit: 200 }),
        ]);
        return json({
          canManage: p.role === 'administrator' || p.role === 'super_admin',
          faculties: faculties.items,
          departments: departments.items,
          programmes: programmes.items,
          courses: courses.items,
          semesters: semesters.items,
          enrollments: p.role === 'student'
            ? enrollments.items.filter((x: any) => x.studentId === p.userId)
            : enrollments.items,
        });
      } catch (e) {
        return error(e instanceof Error ? e.message : 'Academic data unavailable.', 500);
      }
    },
  ],
  'POST /api/academic': [
    requireAuth(),
    async ctx => {
      const denied = await roleGuard(ctx, ['administrator', 'super_admin']);
      if (denied) return denied;
      const b = (ctx.body || {}) as Record<string, unknown>;
      const kind = clean(b.kind, 24);
      const name = clean(b.name, 120);
      const p = await profileFor(ctx.user!);
      const tables: Record<string, string> = {
        faculties: 'afams_faculties',
        departments: 'afams_departments',
        programmes: 'afams_programmes',
        courses: 'afams_courses',
        semesters: 'afams_semesters',
        enrollments: 'afams_enrollments',
      };
      const table = tables[kind];
      if (!table) return error('Unsupported academic record type.', 400);
      if (kind !== 'enrollments' && name.length < 2)
        return error('Enter a valid name (at least 2 characters).', 400);
      const id = 'ac_' + crypto.randomUUID().replace(/-/g, '');
      const record: Record<string, unknown> = {
        createdAt: now(),
        createdBy: p.userId,
      };
      if (kind === 'faculties') {
        Object.assign(record, { name, code: clean(b.code, 20).toUpperCase() });
      } else if (kind === 'departments') {
        const facultyId = clean(b.facultyId, 80);
        const [faculty] = await db.get('afams_faculties', [facultyId]);
        if (!faculty) return error('Select an existing faculty.', 400);
        Object.assign(record, { name, code: clean(b.code, 20).toUpperCase(), facultyId });
      } else if (kind === 'programmes') {
        const departmentId = clean(b.departmentId, 80);
        const [department] = await db.get('afams_departments', [departmentId]);
        if (!department) return error('Select an existing department.', 400);
        Object.assign(record, { name, code: clean(b.code, 20).toUpperCase(), departmentId, award: clean(b.award, 60) });
      } else if (kind === 'courses') {
        const programmeId = clean(b.programmeId, 80);
        const [programme] = await db.get('afams_programmes', [programmeId]);
        if (!programme) return error('Select an existing programme.', 400);
        Object.assign(record, { name, code: clean(b.code, 20).toUpperCase(), programmeId, credits: Math.max(0, Math.min(60, Number(b.credits) || 0)) });
      } else if (kind === 'semesters') {
        const startDate = clean(b.startDate, 10);
        const endDate = clean(b.endDate, 10);
        if (!/^\\d{4}-\\d{2}-\\d{2}$/.test(startDate) || !/^\\d{4}-\\d{2}-\\d{2}$/.test(endDate) || endDate < startDate)
          return error('Provide valid semester start and end dates.', 400);
        Object.assign(record, { name, academicYear: clean(b.academicYear, 20), startDate, endDate });
      } else {
        const courseId = clean(b.courseId, 100);
        const studentId = clean(b.studentId, 100);
        const [courseRecord] = await db.get('afams_courses', [courseId]);
        const [student] = await db.get<UserRecord>('afams_users', [studentId]);
        if (!courseRecord) return error('Select an existing course.', 400);
        if (!student || student.role !== 'student') return error('Student account was not found. Ask the student to sign in first.', 400);
        const enrollmentId = 'en_' + courseId + '_' + studentId;
        const [created] = await db.tx.add(table, [{
          id: enrollmentId, courseId, studentId, status: 'active', createdAt: now(), createdBy: p.userId,
        }]);
        if (!created) return error('This student is already enrolled in this course.', 409);
        await audit(p.userId, 'Student enrolled in course', courseId + ' · ' + studentId);
        return json({ ok: true, item: { id: enrollmentId, courseId, studentId, status: 'active' } }, 201);
      }
      const [created] = await db.tx.add(table, [{ id, ...record }]);
      if (!created) return error('Could not save academic record.', 503);
      await audit(p.userId, 'Academic record created', kind + ' · ' + name);
      return json({ ok: true, item: { id, ...record } }, 201);
    },
  ],
  'DELETE /api/academic/:kind/:id': [
    requireAuth(),
    async ctx => {
      const denied = await roleGuard(ctx, ['administrator', 'super_admin']);
      if (denied) return denied;
      const tables: Record<string, string> = {
        faculties: 'afams_faculties',
        departments: 'afams_departments',
        programmes: 'afams_programmes',
        courses: 'afams_courses',
        semesters: 'afams_semesters',
        enrollments: 'afams_enrollments',
      };
      const table = tables[clean(ctx.params.kind, 24)];
      const id = clean(ctx.params.id, 160);
      if (!table || !id) return error('Invalid academic record.', 400);
      const [removed] = await db.delete(table, [id]);
      if (!removed) return error('Record was not found or could not be removed.', 404);
      const p = await profileFor(ctx.user!);
      await audit(p.userId, 'Academic record deleted', ctx.params.kind + ' · ' + id);
      return json({ ok: true });
    },
  ],
  'POST /api/focus/events': [
    requireAuth(),
    async ctx => {
      const p = await profileFor(ctx.user!);
      if (p.role !== 'student') return error('Focus monitoring events are submitted by student accounts.', 403);
      const b = (ctx.body || {}) as Record<string, unknown>;
      const sessionId = clean(b.sessionId, 120);
      const eventType = clean(b.eventType, 20);
      if (!sessionId || !['hidden', 'visible'].includes(eventType))
        return error('Provide a valid session and focus event.', 400);
      const [session] = await db.get<any>('afams_sessions', [sessionId], { consistent: true });
      if (!session || session.status !== 'active' || session.expiresAt <= now())
        return error('The selected class session is no longer active.', 410);
      const attendanceId = sessionId + '_' + p.userId;
      const [record] = await db.get<any>('afams_attendance', [attendanceId], { consistent: true });
      if (!record) return error('Check in to the class before starting focus monitoring.', 409);
      if (record.status === 'Rejected') return error('This attendance record is already marked absent or rejected.', 409);
      const policy = ['strict', 'grace', 'standard'].includes(session.focusPolicy) ? session.focusPolicy : 'standard';
      const timestamp = now();
      const eventId = 'fe_' + crypto.randomUUID().replace(/-/g, '');
      await db.add('afams_focus_events', [{
        id: eventId, sessionId, studentId: p.userId, eventType, policy, createdAt: timestamp,
      }]);
      const interruptions = Number(record.interruptions || 0) + (eventType === 'hidden' ? 1 : 0);
      let patch: Record<string, unknown> = { interruptions, lastFocusEventAt: timestamp };
      if (eventType === 'hidden') {
        if (policy === 'strict') {
          patch = { ...patch, status: 'Rejected', focusStatus: 'absent', focusReason: 'Strict focus policy interruption' };
        } else if (policy === 'grace') {
          patch = { ...patch, focusStatus: 'grace', focusGraceUntil: timestamp + 60000 };
        } else {
          patch = { ...patch, focusStatus: 'interrupted' };
        }
      } else if (record.focusStatus === 'grace') {
        if (timestamp > Number(record.focusGraceUntil || 0)) {
          patch = { ...patch, status: 'Rejected', focusStatus: 'absent', focusReason: 'Grace period exceeded' };
        } else {
          patch = { ...patch, focusStatus: 'resumed', focusGraceUntil: null };
        }
      } else {
        patch = { ...patch, focusStatus: 'resumed' };
      }
      const [updated] = await db.tx.update('afams_attendance', [{
        id: attendanceId, record: patch, if: { status: record.status },
      }], { patch: true });
      if (!updated) return error('Focus state changed concurrently. Refresh and retry.', 409);
      await audit(p.userId, 'Focus ' + eventType, session.course + ' · ' + policy);
      return json({ ok: true, focusStatus: patch.focusStatus || record.focusStatus, interruptions, attendanceStatus: patch.status || record.status });
    },
  ],
  'POST /api/ai/assistant': [
    requireAuth(),
    async ctx => {
      const p = await profileFor(ctx.user!);
      const b = (ctx.body || {}) as Record<string, unknown>;
      const question = clean(b.question, 1200);
      if (question.length < 3) return error('Enter an academic question.', 400);
      const [attendance, enrollments, sessions] = await Promise.all([
        db.list<any>('afams_attendance', { limit: 300 }),
        db.list<any>('afams_enrollments', { limit: 300 }),
        db.list<any>('afams_sessions', { limit: 300 }),
      ]);
      const ownSessions = sessions.items.filter((s: any) =>
        p.role === 'student' ? s.status === 'active' || s.createdBy === p.userId :
        p.role === 'lecturer' ? s.createdBy === p.userId : true
      );
      const ownSessionIds = new Set(ownSessions.map((s: any) => s.id));
      const visibleAttendance = attendance.items.filter((r: any) =>
        p.role === 'student' ? r.studentId === p.userId : ownSessionIds.has(r.sessionId)
      );
      const visibleEnrollments = p.role === 'student'
        ? enrollments.items.filter((r: any) => r.studentId === p.userId)
        : [];
      const context = {
        role: p.role,
        enrolledCourses: visibleEnrollments.map((r: any) => r.courseId),
        attendance: {
          total: visibleAttendance.length,
          verified: visibleAttendance.filter((r: any) => r.status === 'Verified').length,
          pending: visibleAttendance.filter((r: any) => r.status === 'Pending Verification').length,
          rejected: visibleAttendance.filter((r: any) => r.status === 'Rejected').length,
        },
        activeClasses: ownSessions.filter((s: any) => s.status === 'active').map((s: any) => s.course).slice(0, 20),
      };
      try {
        const result = await ai.generate({
          system: 'You are AFAMS Academic Assistant. Give accurate, supportive academic guidance. Use the supplied AFAMS context only for claims about the user records. Never invent grades, attendance, courses, university policies, deadlines or institutional facts. Clearly say when information is not available. Explain concepts step by step when asked. Do not make attendance or academic record changes.',
          prompt: 'AFAMS user context: ' + JSON.stringify(context) + '\nUser question: ' + question,
          maxTokens: 1000,
          thinkingMode: 'FAST',
        });
        return json({ answer: result.text });
      } catch (e) {
        return error(e instanceof Error ? e.message : 'Academic assistant is temporarily unavailable.', 503);
      }
    },
  ],
  'POST /api/ai/quiz': [
    requireAuth(),
    async ctx => {
      const b = (ctx.body || {}) as Record<string, unknown>;
      const topic = clean(b.topic, 160);
      const material = clean(b.material, 6000);
      const count = Math.max(3, Math.min(10, Math.floor(Number(b.count) || 5)));
      if (topic.length < 2) return error('Enter a quiz topic.', 400);
      try {
        const result = await ai.generate({
          system: 'You are an expert university tutor. Generate clear, fair practice questions from the supplied course topic and notes. Include the correct answer and a brief explanation after each question. If notes are provided, prioritize them and do not introduce unsupported course-specific facts. Label the result as practice material, not an official examination.',
          prompt: 'Create ' + count + ' multiple-choice practice questions about: ' + topic + '\nCourse material / notes:\n' + (material || 'No notes supplied; use general established knowledge for this topic.') + '\nFor each question provide A-D options, the correct answer and a concise explanation.',
          maxTokens: 2200,
          thinkingMode: 'FAST',
        });
        return json({ quiz: result.text });
      } catch (e) {
        return error(e instanceof Error ? e.message : 'Quiz generation is temporarily unavailable.', 503);
      }
    },
  ],
  'GET /api/reports/attendance': [
    requireAuth(),
    async ({ user }) => {
      const p = await profileFor(user!);
      const [attendance, sessions] = await Promise.all([
        db.list<any>('afams_attendance', { limit: 1000 }),
        db.list<any>('afams_sessions', { limit: 500 }),
      ]);
      const sessionMap = new Map(sessions.items.map((s: any) => [s.id, s]));
      const rows = attendance.items.filter((record: any) => {
        const session = sessionMap.get(record.sessionId) as any;
        if (p.role === 'student') return record.studentId === p.userId;
        if (p.role === 'lecturer') return session?.createdBy === p.userId;
        return true;
      }).map((record: any) => {
        const session = sessionMap.get(record.sessionId) as any;
        return {
          ...record,
          venue: session?.location || '',
          sessionStartedAt: session?.startsAt || record.checkedInAt,
          locationVerified: Boolean(record.locationVerified),
        };
      }).sort((a: any, b: any) => b.checkedInAt - a.checkedInAt);
      const summary = {
        total: rows.length,
        verified: rows.filter((r: any) => r.status === 'Verified').length,
        pending: rows.filter((r: any) => r.status === 'Pending Verification').length,
        rejected: rows.filter((r: any) => r.status === 'Rejected').length,
        gpsVerified: rows.filter((r: any) => r.locationVerified).length,
      };
      const courseMap = new Map<string, { course: string; total: number; verified: number; pending: number; rejected: number }>();
      for (const row of rows) {
        const item = courseMap.get(row.course) || { course: row.course, total: 0, verified: 0, pending: 0, rejected: 0 };
        item.total += 1;
        if (row.status === 'Verified') item.verified += 1;
        if (row.status === 'Pending Verification') item.pending += 1;
        if (row.status === 'Rejected') item.rejected += 1;
        courseMap.set(row.course, item);
      }
      return json({ summary, byCourse: Array.from(courseMap.values()).sort((a, b) => a.course.localeCompare(b.course)), rows });
    },
  ],
  'GET /api/announcements': [
    requireAuth(),
    async ({ user }) => {
      const p = await profileFor(user!);
      const r = await db.list<any>('afams_announcements', { limit: 200 });
      const announcements = r.items.filter((item: any) =>
        item.status === 'published' &&
        (!item.expiresAt || item.expiresAt > now()) &&
        (item.audience === 'all' ||
          (item.audience === 'students' && p.role === 'student') ||
          (item.audience === 'lecturers' && p.role === 'lecturer') ||
          (item.audience === 'staff' && ['lecturer', 'administrator', 'super_admin'].includes(p.role)))
      ).sort((a: any, b: any) => b.createdAt - a.createdAt);
      return json({ announcements });
    },
  ],
  'POST /api/announcements': [
    requireAuth(),
    async ctx => {
      const denied = await roleGuard(ctx, ['lecturer', 'administrator', 'super_admin']);
      if (denied) return denied;
      const b = (ctx.body || {}) as Record<string, unknown>;
      const title = clean(b.title, 120);
      const body = clean(b.body, 3000);
      const audience = clean(b.audience, 20) || 'all';
      if (title.length < 3 || body.length < 5)
        return error('Enter a title and announcement message.', 400);
      if (!['all', 'students', 'lecturers', 'staff'].includes(audience))
        return error('Choose a valid announcement audience.', 400);
      const p = await profileFor(ctx.user!);
      const id = 'an_' + crypto.randomUUID().replace(/-/g, '');
      const item = {
        id, title, body, audience, status: 'published',
        createdAt: now(), createdBy: p.userId,
        authorName: p.name || 'Campus staff',
      };
      const [created] = await db.tx.add('afams_announcements', [item]);
      if (!created) return error('Could not publish announcement.', 503);
      await audit(p.userId, 'Announcement published', title);
      return json({ ok: true, announcement: item }, 201);
    },
  ],
  'DELETE /api/announcements/:id': [
    requireAuth(),
    async ctx => {
      const p = await profileFor(ctx.user!);
      const id = clean(ctx.params.id, 120);
      const [item] = await db.get<any>('afams_announcements', [id], { consistent: true });
      if (!item) return error('Announcement was not found.', 404);
      if (!['administrator', 'super_admin'].includes(p.role) && item.createdBy !== p.userId)
        return error('You can only remove your own announcements.', 403);
      const [removed] = await db.delete('afams_announcements', [id]);
      if (!removed) return error('Could not remove announcement.', 503);
      await audit(p.userId, 'Announcement deleted', item.title);
      return json({ ok: true });
    },
  ],
  'GET /api/timetable': [
    requireAuth(),
    async ({ user }) => {
      try {
        const p = await profileFor(user!);
        const [timetable, enrollments] = await Promise.all([
          db.list('afams_timetable', { limit: 300 }),
          p.role === 'student'
            ? db.list('afams_enrollments', { limit: 300 })
            : Promise.resolve({ items: [] as any[] }),
        ]);
        const enrolledCourseIds = new Set(
          enrollments.items
            .filter((item: any) => item.studentId === p.userId && item.status === 'active')
            .map((item: any) => item.courseId)
        );
        const visible = timetable.items.filter((item: any) => {
          if (p.role === 'student') return enrolledCourseIds.has(item.courseId);
          if (p.role === 'lecturer') return item.lecturerId === p.userId;
          return true;
        });
        return json({ timetable: visible.sort((a: any, b: any) =>
          String(a.dayOfWeek).localeCompare(String(b.dayOfWeek)) ||
          String(a.startTime).localeCompare(String(b.startTime))
        ), canManage: p.role !== 'student' });
      } catch (e) {
        return error(e instanceof Error ? e.message : 'Timetable unavailable.', 500);
      }
    },
  ],
  'POST /api/timetable': [
    requireAuth(),
    async ctx => {
      const denied = await roleGuard(ctx, ['lecturer', 'administrator', 'super_admin']);
      if (denied) return denied;
      const b = (ctx.body || {}) as Record<string, unknown>;
      const courseId = clean(b.courseId, 100);
      const dayOfWeek = clean(b.dayOfWeek, 12);
      const startTime = clean(b.startTime, 5);
      const endTime = clean(b.endTime, 5);
      const venue = clean(b.venue, 100);
      const semesterId = clean(b.semesterId, 100);
      if (!/^(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)$/.test(dayOfWeek))
        return error('Choose a valid day of the week.', 400);
      if (!/^([01]\\d|2[0-3]):[0-5]\\d$/.test(startTime) ||
          !/^([01]\\d|2[0-3]):[0-5]\\d$/.test(endTime) || endTime <= startTime)
        return error('Provide a valid time range; end must be after start.', 400);
      if (!courseId || !venue) return error('Select a course and enter a venue.', 400);
      const [courseRecord] = await db.get('afams_courses', [courseId]);
      if (!courseRecord) return error('Selected course was not found.', 404);
      if (semesterId) {
        const [semester] = await db.get('afams_semesters', [semesterId]);
        if (!semester) return error('Selected semester was not found.', 404);
      }
      const p = await profileFor(ctx.user!);
      const duplicate = await db.list('afams_timetable', { limit: 300 });
      const clash = duplicate.items.some((item: any) =>
        item.courseId === courseId && item.dayOfWeek === dayOfWeek &&
        item.startTime === startTime && item.lecturerId === p.userId
      );
      if (clash) return error('This course already has a timetable entry at that time for your account.', 409);
      const id = 'tt_' + crypto.randomUUID().replace(/-/g, '');
      const record = {
        id, courseId, courseName: (courseRecord as any).name || 'Course',
        courseCode: (courseRecord as any).code || '',
        dayOfWeek, startTime, endTime, venue, semesterId: semesterId || null,
        lecturerId: p.userId, createdAt: now(), createdBy: p.userId, status: 'active',
      };
      const [created] = await db.tx.add('afams_timetable', [record]);
      if (!created) return error('Could not save timetable entry.', 503);
      await audit(p.userId, 'Timetable entry created', record.courseName + ' · ' + dayOfWeek + ' ' + startTime);
      return json({ ok: true, item: record }, 201);
    },
  ],
  'DELETE /api/timetable/:id': [
    requireAuth(),
    async ctx => {
      const p = await profileFor(ctx.user!);
      const id = clean(ctx.params.id, 120);
      const [entry] = await db.get<any>('afams_timetable', [id], { consistent: true });
      if (!entry) return error('Timetable entry was not found.', 404);
      if (p.role !== 'administrator' && p.role !== 'super_admin' &&
          !(p.role === 'lecturer' && entry.lecturerId === p.userId))
        return error('You cannot remove this timetable entry.', 403);
      const [removed] = await db.delete('afams_timetable', [id]);
      if (!removed) return error('Could not remove timetable entry.', 503);
      await audit(p.userId, 'Timetable entry deleted', id);
      return json({ ok: true });
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
