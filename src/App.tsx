import { useEffect, useMemo, useRef, useState } from 'react';
import AcademicAdmin from './AcademicAdmin';
import Timetable from './Timetable';
import AttendanceReview from './AttendanceReview';
import AnnouncementBoard from './AnnouncementBoard';
import AttendanceReports from './AttendanceReports';
import { QRCodeSVG } from 'qrcode.react';
import { auth, api } from '@appdeploy/client';
import {
  Activity,
  ArrowUpRight,
  Bell,
  BookOpen,
  CalendarDays,
  Check,
  CheckCircle2,
  Clock3,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Menu,
  Plus,
  QrCode,
  ScanLine,
  Search,
  ShieldCheck,
  Sparkles,
  Timer,
  TrendingUp,
  Users,
  X,
  Zap,
  ClipboardList,
  MapPin,
  AlertCircle,
  Settings,
} from 'lucide-react';

type Role = 'student' | 'lecturer' | 'administrator' | 'super_admin';
type Profile = { userId: string; email?: string; name?: string; role: Role };
type Session = {
  id: string;
  course: string;
  location: string;
  code: string;
  createdBy: string;
  startsAt: number;
  expiresAt: number;
  status: string;
};
type Attendance = {
  id: string;
  sessionId: string;
  studentId: string;
  course: string;
  checkedInAt: number;
  status: string;
};
type Workspace = {
  profile: Profile;
  stats: {
    sessions: number;
    attendance: number;
    activeSessions: number;
    attendanceRate: number | null;
  };
  sessions: Session[];
  attendance: Attendance[];
  audit: { id: string; action: string; detail: string; createdAt: number }[];
};
const roleLabel: Record<Role, string> = {
  student: 'Student',
  lecturer: 'Lecturer',
  administrator: 'Administrator',
  super_admin: 'Super Admin',
};
const initials = (s = 'AF') =>
  s
    .split(/[ @._-]/)
    .filter(Boolean)
    .slice(0, 2)
    .map(x => x[0])
    .join('')
    .toUpperCase();
const stamp = (n: number) =>
  new Date(n).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });

function getBrowserPosition(): Promise<{ latitude: number; longitude: number; accuracy: number }> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('This browser does not support location sharing.'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      position => resolve({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
      }),
      () => reject(new Error('Location permission was denied or the device could not determine its position.')),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  });
}

function App() {
  const [user, setUser] = useState<any>(null),
    [profile, setProfile] = useState<Profile | null>(null),
    [data, setData] = useState<Workspace | null>(null);
  const [loading, setLoading] = useState(true),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [notice, setNotice] = useState('');
  const [view, setView] = useState('Overview'),
    [mobile, setMobile] = useState(false),
    [search, setSearch] = useState('');
  const [sessionOpen, setSessionOpen] = useState(false),
    [checkOpen, setCheckOpen] = useState(false),
    [course, setCourse] = useState(''),
    [venue, setVenue] = useState(''),
    [duration, setDuration] = useState('60'),
    [code, setCode] = useState('');
  const [sessionLocationRequired, setSessionLocationRequired] = useState(false);
  const [sessionGeo, setSessionGeo] = useState<{ latitude: number; longitude: number } | null>(null);
  const [checkinGeo, setCheckinGeo] = useState<{ latitude: number; longitude: number; accuracy: number } | null>(null);
  const [geoMessage, setGeoMessage] = useState('');
  const [minutes, setMinutes] = useState(25),
    [seconds, setSeconds] = useState(1500),
    [running, setRunning] = useState(false);
  const role = profile?.role || 'student',
    canTeach = ['lecturer', 'administrator', 'super_admin'].includes(role),
    admin = ['administrator', 'super_admin'].includes(role);
  async function load() {
    const me = await api.get('/api/me');
    setProfile(me.data.profile);
    const d = await api.get('/api/dashboard');
    setData(d.data);
  }
  useEffect(() => {
    let live = true;
    auth
      .getUser()
      .then(async u => {
        if (!live) return;
        setUser(u);
        if (u) {
          try {
            await load();
          } catch (e: any) {
            setError(
              e?.response?.data?.error ||
                e?.message ||
                'Could not load workspace.'
            );
          }
        }
        if (live) setLoading(false);
      })
      .catch((e: any) => {
        if (live) {
          setError(e?.message || 'Authentication restoration failed.');
          setLoading(false);
        }
      });
    return () => {
      live = false;
    };
  }, []);
  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(
      () =>
        setSeconds(s => {
          if (s <= 1) {
            setRunning(false);
            setNotice('Focus block complete. Take a short break.');
            return 0;
          }
          return s - 1;
        }),
      1000
    );
    return () => window.clearInterval(id);
  }, [running]);
  async function refresh() {
    setBusy(true);
    setError('');
    try {
      await load();
    } catch (e: any) {
      setError(e?.response?.data?.error || e?.message || 'Refresh failed.');
    } finally {
      setBusy(false);
    }
  }
  async function signIn() {
    setError('');
    try {
      await auth.signInWithRedirect();
    } catch (e: any) {
      setError(e?.message || 'Sign in failed. Try again.');
    }
  }
  async function signOut() {
    await auth.signOut();
    setUser(null);
    setProfile(null);
    setData(null);
  }
  async function createSession(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      let classroomPosition = null;
      if (sessionLocationRequired) classroomPosition = await getBrowserPosition();
      await api.post('/api/sessions', {
        course: course.trim(),
        location: venue.trim(),
        durationMinutes: Number(duration),
        locationRequired: sessionLocationRequired,
        latitude: classroomPosition?.latitude,
        longitude: classroomPosition?.longitude,
        radiusMeters: 150,
      });
      setSessionOpen(false);
      setCourse('');
      setVenue('');
      setNotice('Session created. Share its access code with your class.');
      await refresh();
    } catch (e: any) {
      setError(
        e?.response?.data?.error || e?.message || 'Session creation failed.'
      );
    } finally {
      setBusy(false);
    }
  }
  async function checkIn(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const r = await api.post('/api/check-in', {
        code: code.trim().toUpperCase(),
        latitude: checkinGeo?.latitude,
        longitude: checkinGeo?.longitude,
        accuracy: checkinGeo?.accuracy,
      });
      setNotice(r.data.message || 'Attendance recorded.');
      setCheckOpen(false);
      setCode('');
      setCheckinGeo(null);
      setGeoMessage('');
      await refresh();
    } catch (e: any) {
      setError(e?.response?.data?.error || e?.message || 'Check-in failed.');
    } finally {
      setBusy(false);
    }
  }
  const sessions = data?.sessions || [],
    attendance = data?.attendance || [],
    stats = data?.stats || {
      sessions: 0,
      attendance: 0,
      activeSessions: 0,
      attendanceRate: null,
    };
  const filtered = useMemo(
    () =>
      sessions.filter(s =>
        s.course.toLowerCase().includes(search.toLowerCase())
      ),
    [sessions, search]
  );
  if (loading)
    return (
      <div className="loading">
        <div className="brand">AF</div>
        <div className="spinner" />
        <span>Preparing your academic workspace…</span>
      </div>
    );
  if (!user)
    return (
      <main className="login">
        <section className="login-art">
          <div className="brand-row">
            <div className="brand">AF</div>
            <div>
              <b>AFAMS</b>
              <small>ACADEMIC INTELLIGENCE</small>
            </div>
          </div>
          <div className="hero">
            <span className="eyebrow">THE SMARTER CAMPUS</span>
            <h1>
              Make every
              <br />
              <em>moment count.</em>
            </h1>
            <p>
              Attendance, academic focus and institutional insight — connected
              in one secure workspace.
            </p>
            <div className="orb">
              <GraduationCap size={46} />
            </div>
          </div>
        </section>
        <section className="login-panel">
          <span className="eyebrow">WELCOME TO AFAMS</span>
          <h2>
            Your campus,
            <br />
            in sync.
          </h2>
          <p>
            Sign in with your institution-approved account to continue to your
            workspace.
          </p>
          <button className="primary wide" onClick={signIn}>
            <ShieldCheck size={18} /> Secure sign in <ArrowUpRight size={17} />
          </button>
          <div className="security">
            <ShieldCheck size={16} /> Protected access · Role-based permissions
          </div>
          {error && <div className="alert bad">{error}</div>}
          <small className="legal">
            AFAMS · Attendance & Focus Academic Management System
          </small>
        </section>
      </main>
    );
  const nav = [
    ['Overview', LayoutDashboard],
    ['Attendance', ScanLine],
    ...(canTeach ? [['Review attendance', ClipboardList]] : []),
    ['Sessions', CalendarDays],
    ['Timetable', CalendarDays],
    ['Announcements', Bell],
    ['Reports', ClipboardList],
    ['Focus Client', Timer],
    ...(admin
      ? [
          ['Academic administration', BookOpen],
          ['People', Users],
          ['Audit trail', ClipboardList],
        ]
      : []),
  ];
  return (
    <div className="shell">
      <aside className={'sidebar ' + (mobile ? 'show' : '')}>
        <div className="brand-row">
          <div className="brand">AF</div>
          <div>
            <b>AFAMS</b>
            <small>ACADEMIC INTELLIGENCE</small>
          </div>
          <button
            className="icon mobile-close"
            onClick={() => setMobile(false)}
          >
            <X />
          </button>
        </div>
        <div className="nav-caption">WORKSPACE</div>
        <nav>
          {nav.map(([label, Icon]: any) => (
            <button
              key={label}
              className={'nav-item ' + (view === label ? 'active' : '')}
              onClick={() => {
                setView(label);
                setMobile(false);
              }}
            >
              <Icon size={18} />
              {label}
            </button>
          ))}
        </nav>
        <div className="side-bottom">
          <div className="secure">
            <ShieldCheck size={17} />
            <div>
              <b>Secure environment</b>
              <small>Access is monitored</small>
            </div>
          </div>
          <button className="nav-item" onClick={() => setView('Settings')}>
            <Settings size={18} />
            Settings
          </button>
          <div className="account">
            <div className="avatar">
              {initials(profile?.name || user.name || user.email)}
            </div>
            <div>
              <b>{profile?.name || user.name || 'Campus user'}</b>
              <small>{roleLabel[role]}</small>
            </div>
            <button className="icon" onClick={signOut} title="Sign out">
              <LogOut size={17} />
            </button>
          </div>
        </div>
      </aside>
      {mobile && <button className="scrim" onClick={() => setMobile(false)} />}
      <main className="main">
        <header className="topbar">
          <div className="crumb">
            <button
              className="icon mobile-menu"
              onClick={() => setMobile(true)}
            >
              <Menu />
            </button>
            AFAMS <span>/</span> <b>{view}</b>
          </div>
          <div className="top-actions">
            <span className="operational">
              <i /> SYSTEM OPERATIONAL
            </span>
            <Bell size={18} />
            <div className="avatar">
              {initials(profile?.name || user.name || user.email)}
            </div>
          </div>
        </header>
        <div className="content">
          {error && (
            <div className="alert bad">
              <AlertCircle size={16} />
              {error}
              <button onClick={() => setError('')}>×</button>
            </div>
          )}
          {notice && (
            <div className="alert good">
              <CheckCircle2 size={16} />
              {notice}
              <button onClick={() => setNotice('')}>×</button>
            </div>
          )}
          {view === 'Overview' && (
            <>
              <div className="heading">
                <div>
                  <span className="eyebrow">YOUR ACADEMIC COMMAND CENTER</span>
                  <h1>
                    Good{' '}
                    {new Date().getHours() < 12
                      ? 'morning'
                      : new Date().getHours() < 17
                        ? 'afternoon'
                        : 'evening'}
                    , {(profile?.name || user.name || 'there').split(' ')[0]}.
                  </h1>
                  <p>
                    Here’s what’s happening across your academic workspace
                    today.
                  </p>
                </div>
                <button className="outline" onClick={refresh}>
                  <Activity size={16} />
                  {busy ? 'Refreshing…' : 'Refresh data'}
                </button>
              </div>
              <div className="metrics">
                <Metric
                  icon={<CalendarDays />}
                  label="Total sessions"
                  value={stats.sessions}
                />
                <Metric
                  icon={<CheckCircle2 />}
                  label="Attendance records"
                  value={stats.attendance}
                />
                <Metric
                  icon={<Zap />}
                  label="Active sessions"
                  value={stats.activeSessions}
                />
                <Metric
                  icon={<TrendingUp />}
                  label="Attendance rate"
                  value={stats.attendanceRate === null ? '—' : stats.attendanceRate + '%'}
                />
              </div>
              <div className="columns">
                <section className="panel">
                  <div className="panel-title">
                    <div>
                      <span className="eyebrow">ACADEMIC ACTIVITY</span>
                      <h3>Recent sessions</h3>
                    </div>
                    <button
                      className="link"
                      onClick={() => setView('Sessions')}
                    >
                      View all ↗
                    </button>
                  </div>
                  {sessions.length ? (
                    sessions
                      .slice(0, 5)
                      .map(s => <SessionRow key={s.id} s={s} />)
                  ) : (
                    <Empty
                      icon={<CalendarDays />}
                      title="No sessions yet"
                      text={
                        canTeach
                          ? 'Create your first attendance session.'
                          : 'Published lecturer sessions will appear here.'
                      }
                    />
                  )}
                </section>
                <section className="panel">
                  <div className="panel-title">
                    <div>
                      <span className="eyebrow">QUICK ACTIONS</span>
                      <h3>Make a move</h3>
                    </div>
                    <Sparkles color="#43d8c2" />
                  </div>
                  <Action
                    icon={<ScanLine />}
                    title="Check in to class"
                    text="Enter your session access code"
                    onClick={() => setCheckOpen(true)}
                  />
                  {canTeach && (
                    <Action
                      icon={<Plus />}
                      title="Create a session"
                      text="Start an attendance window"
                      onClick={() => setSessionOpen(true)}
                    />
                  )}
                  <Action
                    icon={<Timer />}
                    title="Start focus mode"
                    text="Protect time for deep work"
                    onClick={() => setView('Focus Client')}
                  />
                  <div className="tip">
                    <Sparkles size={16} /> Build consistent study habits with
                    Focus Client.
                  </div>
                </section>
              </div>
              <section className="panel">
                <div className="panel-title">
                  <div>
                    <span className="eyebrow">YOUR RECORD</span>
                    <h3>Recent attendance</h3>
                  </div>
                  <button
                    className="link"
                    onClick={() => setView('Attendance')}
                  >
                    Attendance history ↗
                  </button>
                </div>
                {attendance.length ? (
                  <AttendanceTable rows={attendance.slice(0, 6)} />
                ) : (
                  <Empty
                    icon={<ClipboardList />}
                    title="Your attendance history is empty"
                    text="Check in with a valid session code to create your first record."
                  />
                )}
              </section>
            </>
          )}
          {view === 'Sessions' && (
            <>
              <div className="heading">
                <div>
                  <span className="eyebrow">CLASSROOM OPERATIONS</span>
                  <h1>Attendance sessions</h1>
                  <p>Manage live sessions and review access details.</p>
                </div>
                {canTeach && (
                  <button
                    className="primary"
                    onClick={() => setSessionOpen(true)}
                  >
                    <Plus size={17} /> New session
                  </button>
                )}
              </div>
              <div className="toolbar">
                <div className="search">
                  <Search size={17} />
                  <input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search courses…"
                  />
                </div>
                <small>{filtered.length} sessions</small>
              </div>
              <section className="panel">
                {filtered.length ? (
                  filtered.map(s => <SessionRow key={s.id} s={s} />)
                ) : (
                  <Empty
                    icon={<CalendarDays />}
                    title="No matching sessions"
                    text="Try another course name or create a session."
                  />
                )}
              </section>
            </>
          )}
          {view === 'Review attendance' && canTeach && <AttendanceReview />}
          {view === 'Attendance' && (
            <>
              <div className="heading">
                <div>
                  <span className="eyebrow">VERIFIED PARTICIPATION</span>
                  <h1>Attendance history</h1>
                  <p>
                    Your recorded class participation and check-in activity.
                  </p>
                </div>
                <button className="primary" onClick={() => setCheckOpen(true)}>
                  <ScanLine size={17} /> Check in
                </button>
              </div>
              <section className="panel">
                {attendance.length ? (
                  <AttendanceTable rows={attendance} />
                ) : (
                  <Empty
                    icon={<ClipboardList />}
                    title="No attendance records"
                    text="Check in to a live session to create your first record."
                  />
                )}
              </section>
            </>
          )}
          {view === 'Focus Client' && (
            <>
              <div className="heading">
                <div>
                  <span className="eyebrow">PERSONAL PRODUCTIVITY</span>
                  <h1>Focus Client</h1>
                  <p>
                    A calm space to build consistent study and work sessions.
                  </p>
                </div>
                <span className="live">● FOCUS SPACE</span>
              </div>
              <div className="focus-grid">
                <section className="panel timer-panel">
                  <span className="eyebrow">DEEP WORK TIMER</span>
                  <div className="timer">
                    <div>
                      <b>
                        {String(Math.floor(seconds / 60)).padStart(2, '0')}:
                        {String(seconds % 60).padStart(2, '0')}
                      </b>
                      <small>MINUTES LEFT</small>
                    </div>
                  </div>
                  <div className="presets">
                    {[15, 25, 45, 60].map(n => (
                      <button
                        className={minutes === n ? 'chosen' : ''}
                        onClick={() => {
                          setMinutes(n);
                          setSeconds(n * 60);
                          setRunning(false);
                        }}
                      >
                        {n} min
                      </button>
                    ))}
                  </div>
                  <div className="timer-buttons">
                    <button
                      className="primary"
                      onClick={() => {
                        if (seconds === 0) setSeconds(minutes * 60);
                        setRunning(!running);
                      }}
                    >
                      {running ? 'Pause' : 'Start focus'}
                    </button>
                    <button
                      className="outline"
                      onClick={() => {
                        setRunning(false);
                        setSeconds(minutes * 60);
                      }}
                    >
                      Reset
                    </button>
                  </div>
                </section>
                <section className="panel guide">
                  <span className="eyebrow">THE FOCUS METHOD</span>
                  <h2>
                    One task.
                    <br />
                    <em>All your attention.</em>
                  </h2>
                  <p>
                    Choose one meaningful task, silence distractions and work
                    until the timer ends. Consistency beats intensity.
                  </p>
                  <ol>
                    <li>Define one outcome</li>
                    <li>Remove distractions</li>
                    <li>Work until the bell</li>
                  </ol>
                  <div className="tip">
                    Focus sessions run in this browser tab. Keep this page open.
                  </div>
                </section>
              </div>
            </>
          )}
          {view === 'Academic administration' && admin && <AcademicAdmin />}
          {view === 'Timetable' && <Timetable role={role} />}
          {view === 'Announcements' && <AnnouncementBoard role={role} />}
          {view === 'Reports' && <AttendanceReports role={role} />}
          {view === 'People' && admin && <People onSaved={refresh} />}
          {view === 'Audit trail' && admin && (
            <>
              <div className="heading">
                <div>
                  <span className="eyebrow">SECURITY & GOVERNANCE</span>
                  <h1>Audit trail</h1>
                  <p>Recent administrative and academic activity.</p>
                </div>
              </div>
              <section className="panel">
                {data?.audit?.length ? (
                  data.audit.map(a => (
                    <div className="audit-row">
                      <ShieldCheck />
                      <div>
                        <b>{a.action}</b>
                        <small>{a.detail}</small>
                      </div>
                      <time>{stamp(a.createdAt)}</time>
                    </div>
                  ))
                ) : (
                  <Empty
                    icon={<ShieldCheck />}
                    title="No audit events yet"
                    text="Security-sensitive events will appear here."
                  />
                )}
              </section>
            </>
          )}
          {view === 'Settings' && (
            <>
              <div className="heading">
                <div>
                  <span className="eyebrow">ACCOUNT PREFERENCES</span>
                  <h1>Settings</h1>
                  <p>Your identity and security context.</p>
                </div>
              </div>
              <section className="panel settings">
                <div className="avatar big">
                  {initials(profile?.name || user.name || user.email)}
                </div>
                <div>
                  <h3>{profile?.name || user.name || 'Campus user'}</h3>
                  <p>{profile?.email || user.email}</p>
                  <span className="role-tag">{roleLabel[role]}</span>
                </div>
                <hr />
                <p>
                  Account ID <code>{profile?.userId}</code>
                </p>
                <p>
                  Access control <b>Role-based permissions active</b>
                </p>
                <button className="outline" onClick={signOut}>
                  <LogOut size={16} /> Sign out
                </button>
              </section>
            </>
          )}
        </div>
        <footer>
          AFAMS · Attendance & Focus Academic Management System{' '}
          <span>Built for smarter academic operations ✦</span>
        </footer>
      </main>
      {sessionOpen && (
        <Modal
          title="Create attendance session"
          subtitle="Set up a time-limited check-in window."
          close={() => setSessionOpen(false)}
        >
          <form onSubmit={createSession}>
            <label>
              Course or class name
              <input
                required
                value={course}
                onChange={e => setCourse(e.target.value)}
                placeholder="e.g. Computer Science 2"
              />
            </label>
            <label>
              Venue / classroom
              <input
                value={venue}
                onChange={e => setVenue(e.target.value)}
                placeholder="e.g. Lab 03"
              />
            </label>
            <label className="checkline"><input type="checkbox" checked={sessionLocationRequired} onChange={e => setSessionLocationRequired(e.target.checked)}/> Require GPS geofence verification (150 m)</label>
            {sessionLocationRequired && <p className="hint">Your browser will ask to share the classroom's current coordinates when you create this session.</p>}
            <label>
              Session duration
              <select
                value={duration}
                onChange={e => setDuration(e.target.value)}
              >
                <option value="15">15 minutes</option>
                <option value="30">30 minutes</option>
                <option value="60">1 hour</option>
                <option value="90">90 minutes</option>
                <option value="120">2 hours</option>
              </select>
            </label>
            <button className="primary wide" disabled={busy}>
              {busy ? 'Creating…' : 'Create session'}
            </button>
          </form>
        </Modal>
      )}
      {checkOpen && (
        <Modal
          title="Check in to class"
          subtitle="Enter the six-character code shared by your lecturer."
          close={() => setCheckOpen(false)}
        >
          <form onSubmit={checkIn}>
            <div className="code-box">
              <QrCode />
              <input
                required
                maxLength={6}
                value={code}
                onChange={e => setCode(e.target.value.toUpperCase())}
                placeholder="ENTER CODE"
              />
            </div>
            <p className="hint">
              Codes are time-limited. New check-ins remain pending until reviewed by the lecturer.
            </p>
            <QRScanner onDetected={value => setCode(value)} />
            <button type="button" className="outline" onClick={async () => { setGeoMessage('Requesting location…'); try { const point = await getBrowserPosition(); setCheckinGeo(point); setGeoMessage('Location captured with ±' + Math.round(point.accuracy) + ' m accuracy.'); } catch (e: any) { setGeoMessage(e.message || 'Could not capture location.'); } }}><MapPin size={16}/> Share my current location</button>
            {geoMessage && <p className="hint">{geoMessage}</p>}
            <button className="primary wide" disabled={busy}>
              {busy ? 'Verifying…' : 'Verify & check in'}
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}
function QRScanner({ onDetected }: { onDetected: (value: string) => void }) {
  const [active, setActive] = useState(false);
  const [message, setMessage] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const onDetectedRef = useRef(onDetected);
  useEffect(() => { onDetectedRef.current = onDetected; }, [onDetected]);
  useEffect(() => {
    if (!active) return;
    let stream: MediaStream | null = null;
    let frame = 0;
    let stopped = false;
    async function start() {
      try {
        const Detector = (window as any).BarcodeDetector;
        if (!Detector) {
          setMessage('QR scanning is not supported by this browser. Enter the six-character code manually.');
          setActive(false);
          return;
        }
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
        if (!videoRef.current || stopped) return;
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        const detector = new Detector({ formats: ['qr_code'] });
        const scan = async () => {
          if (stopped || !videoRef.current) return;
          try {
            const codes = await detector.detect(videoRef.current);
            const value = codes?.[0]?.rawValue?.trim().toUpperCase();
            if (value && /^[A-Z0-9]{6}$/.test(value)) {
              onDetectedRef.current(value);
              setMessage('QR code captured. Submit to verify attendance.');
              setActive(false);
              return;
            }
          } catch {
            setMessage('Unable to read this QR code. Adjust the camera or enter the code manually.');
          }
          frame = window.requestAnimationFrame(scan);
        };
        scan();
      } catch {
        setMessage('Camera permission was denied or the camera is unavailable.');
        setActive(false);
      }
    }
    start();
    return () => {
      stopped = true;
      window.cancelAnimationFrame(frame);
      stream?.getTracks().forEach(track => track.stop());
    };
  }, [active]);
  return <div className="qr-scanner">
    <button type="button" className="outline" onClick={() => { setMessage(''); setActive(value => !value); }}>
      <ScanLine size={16}/>{active ? 'Stop QR scanner' : 'Scan QR with camera'}
    </button>
    {active && <video ref={videoRef} muted playsInline />}
    {message && <small className="hint">{message}</small>}
  </div>;
}
function Metric({ icon, label, value }: any) {
  return (
    <div className="metric">
      <div>{icon}</div>
      <b>{value}</b>
      <span>{label}</span>
      <small>LIVE DATA</small>
    </div>
  );
}
function SessionRow({ s }: { s: Session }) {
  const live = s.status === 'active' && s.expiresAt > Date.now();
  return (
    <div className="session-row">
      <div className="session-icon">
        <BookOpen />
      </div>
      <div className="session-main">
        <b>{s.course}</b>
        <small>
          <MapPin size={12} /> {s.location || 'Venue not specified'} ·{' '}
          <Clock3 size={12} /> {stamp(s.startsAt)}
        </small>
      </div>
      <div className="session-code">
        <small>ACCESS CODE</small>
        <b>{s.code}</b>
        {live && <QRCodeSVG value={s.code} size={72} level="M"/>}
      </div>
      <span className={live ? 'live' : 'closed'}>
        ● {live ? 'LIVE' : 'CLOSED'}
      </span>
    </div>
  );
}
function Empty({ icon, title, text }: any) {
  return (
    <div className="empty">
      <div>{icon}</div>
      <b>{title}</b>
      <small>{text}</small>
    </div>
  );
}
function Action({ icon, title, text, onClick }: any) {
  return (
    <button className="action" onClick={onClick}>
      <span>{icon}</span>
      <div>
        <b>{title}</b>
        <small>{text}</small>
      </div>
      <ArrowUpRight size={16} />
    </button>
  );
}
function AttendanceTable({ rows }: { rows: Attendance[] }) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>COURSE</th>
            <th>DATE & TIME</th>
            <th>RECORD</th>
            <th>STATUS</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(a => (
            <tr key={a.id}>
              <td>{a.course}</td>
              <td>{stamp(a.checkedInAt)}</td>
              <td>
                <code>{a.id.slice(0, 12)}</code>
              </td>
              <td>
                <span className="verified">
                  <Check size={12} />
                  {a.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
function Modal({ title, subtitle, close, children }: any) {
  return (
    <div className="backdrop" onMouseDown={close}>
      <section className="modal" onMouseDown={e => e.stopPropagation()}>
        <div className="modal-head">
          <div>
            <h3>{title}</h3>
            <p>{subtitle}</p>
          </div>
          <button className="icon" onClick={close}>
            <X />
          </button>
        </div>
        {children}
      </section>
    </div>
  );
}
function People({ onSaved }: { onSaved: () => void }) {
  const [id, setId] = useState(''),
    [role, setRole] = useState<Role>('lecturer'),
    [message, setMessage] = useState(''),
    [busy, setBusy] = useState(false);
  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage('');
    try {
      await api.post('/api/admin/roles', { userId: id.trim(), role });
      setMessage('Role updated successfully.');
      setId('');
      onSaved();
    } catch (e: any) {
      setMessage(
        e?.response?.data?.error || e?.message || 'Role update failed.'
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <div className="heading">
        <div>
          <span className="eyebrow">INSTITUTIONAL ACCESS</span>
          <h1>People & roles</h1>
          <p>Role assignment is restricted to the Super Admin account.</p>
        </div>
      </div>
      <section className="panel role-panel">
        <h3>Assign institutional access</h3>
        <p className="hint">
          The user must sign in once before their account can be assigned a
          role. Super Admin access is owner-only.
        </p>
        <form onSubmit={save}>
          <label>
            AppDeploy user ID
            <input
              required
              value={id}
              onChange={e => setId(e.target.value)}
              placeholder="Paste the account ID"
            />
          </label>
          <label>
            Assign role
            <select
              value={role}
              onChange={e => setRole(e.target.value as Role)}
            >
              <option value="student">Student</option>
              <option value="lecturer">Lecturer</option>
              <option value="administrator">Administrator</option>
            </select>
          </label>
          <button className="primary" disabled={busy}>
            {busy ? 'Saving…' : 'Save role'}
          </button>
        </form>
        {message && <p className="message">{message}</p>}
      </section>
    </>
  );
}
export default App;
