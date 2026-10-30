import { useEffect, useMemo, useState } from 'react';
import { api } from '@appdeploy/client';
import { CalendarDays, Clock3, MapPin, Plus, RefreshCw, Trash2 } from 'lucide-react';

type Role = 'student' | 'lecturer' | 'class_rep' | 'administrator' | 'super_admin';
type Entry = {
  id: string;
  courseId: string;
  courseName: string;
  courseCode?: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  venue: string;
  semesterId?: string | null;
};
type Course = { id: string; name: string; code?: string };
type Semester = { id: string; name?: string; academicYear?: string };

const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function Timetable({ role }: { role: Role }) {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [canManage, setCanManage] = useState(false);
  const [form, setForm] = useState({ courseId: '', dayOfWeek: 'Monday', startTime: '08:00', endTime: '10:00', venue: '', semesterId: '' });
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  async function load() {
    const [t, a] = await Promise.all([api.get('/api/timetable'), api.get('/api/academic')]);
    setEntries(t.data.timetable || []);
    setCanManage(Boolean(t.data.canManage));
    setCourses(a.data.courses || []);
    setSemesters(a.data.semesters || []);
  }

  useEffect(() => {
    load().catch((e: any) => setMessage(e?.response?.data?.error || e.message || 'Could not load timetable.'));
  }, []);

  const grouped = useMemo(() => days.map(day => ({
    day,
    entries: entries.filter(entry => entry.dayOfWeek === day).sort((a, b) => a.startTime.localeCompare(b.startTime)),
  })).filter(group => group.entries.length), [entries]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage('');
    try {
      await api.post('/api/timetable', form);
      setMessage('Timetable entry saved.');
      setForm(old => ({ ...old, venue: '' }));
      await load();
    } catch (e: any) {
      setMessage(e?.response?.data?.error || e.message || 'Could not save timetable entry.');
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    if (!window.confirm('Remove this timetable entry?')) return;
    setBusy(true);
    setMessage('');
    try {
      await api.delete('/api/timetable/' + encodeURIComponent(id));
      setMessage('Timetable entry removed.');
      await load();
    } catch (e: any) {
      setMessage(e?.response?.data?.error || e.message || 'Could not remove timetable entry.');
    } finally {
      setBusy(false);
    }
  }

  return <>
    <div className="heading">
      <div><span className="eyebrow">ACADEMIC SCHEDULING</span><h1>Class timetable</h1><p>Weekly course schedule, teaching times and classroom locations.</p></div>
      <button className="outline" onClick={() => load()}><RefreshCw size={16}/> Refresh</button>
    </div>
    {canManage && <section className="panel">
      <div className="panel-title"><div><span className="eyebrow">SCHEDULE A CLASS</span><h3>New timetable entry</h3></div><Plus color="#43d8c2"/></div>
      <form onSubmit={save}>
        <label>Course<select required value={form.courseId} onChange={e => setForm(old => ({ ...old, courseId: e.target.value }))}><option value="">Select course</option>{courses.map(course => <option key={course.id} value={course.id}>{course.code ? course.code + ' — ' : ''}{course.name}</option>)}</select></label>
        <label>Day<select required value={form.dayOfWeek} onChange={e => setForm(old => ({ ...old, dayOfWeek: e.target.value }))}>{days.map(day => <option key={day}>{day}</option>)}</select></label>
        <div className="form-grid">
          <label>Start time<input required type="time" value={form.startTime} onChange={e => setForm(old => ({ ...old, startTime: e.target.value }))}/></label>
          <label>End time<input required type="time" value={form.endTime} onChange={e => setForm(old => ({ ...old, endTime: e.target.value }))}/></label>
        </div>
        <label>Venue / classroom<input required value={form.venue} onChange={e => setForm(old => ({ ...old, venue: e.target.value }))} placeholder="e.g. Lecture Hall 2"/></label>
        <label>Semester (optional)<select value={form.semesterId} onChange={e => setForm(old => ({ ...old, semesterId: e.target.value }))}><option value="">No semester selected</option>{semesters.map(s => <option key={s.id} value={s.id}>{s.name || s.academicYear || s.id}</option>)}</select></label>
        <button className="primary" disabled={busy || !courses.length}>{busy ? 'Saving…' : 'Save timetable entry'}</button>
      </form>
      {!courses.length && <p className="hint">Create courses in Academic administration before scheduling classes.</p>}
    </section>}
    {message && <p className="message">{message}</p>}
    {grouped.length ? grouped.map(group => <section className="panel" key={group.day}>
      <div className="panel-title"><div><span className="eyebrow">WEEKLY SCHEDULE</span><h3>{group.day}</h3></div><CalendarDays color="#43d8c2"/></div>
      {group.entries.map(entry => <div className="audit-row" key={entry.id}>
        <Clock3/><div><b>{entry.courseCode ? entry.courseCode + ' · ' : ''}{entry.courseName}</b><small>{entry.startTime}–{entry.endTime} · <MapPin size={12}/> {entry.venue}</small></div>
        {canManage && <button className="icon" disabled={busy} onClick={() => remove(entry.id)} title="Remove entry"><Trash2 size={16}/></button>}
      </div>)}
    </section>) : <section className="panel"><div className="empty"><CalendarDays/><b>No timetable entries</b><small>{role === 'student' ? 'Your enrolled course timetable will appear here.' : 'Add a class schedule after setting up courses.'}</small></div></section>}
  </>;
}
