import { FormEvent, useEffect, useState } from 'react';
import { api } from '@appdeploy/client';
import { Plus, Users } from 'lucide-react';

type Course = { id: string; name: string; code?: string };
type Assignment = { id: string; userId: string; courseId: string; courseName: string; representativeName: string };

export default function ClassRepAdmin() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [userId, setUserId] = useState('');
  const [courseId, setCourseId] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  async function load() {
    const [academic, reps] = await Promise.all([api.get('/api/academic'), api.get('/api/class-rep/assignments')]);
    setCourses(academic.data.courses || []);
    setAssignments(reps.data.assignments || []);
  }
  useEffect(() => { load().catch((e: any) => setMessage(e?.response?.data?.error || e.message || 'Could not load assignments.')); }, []);

  async function assign(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage('');
    try {
      await api.post('/api/class-rep/assignments', { userId: userId.trim(), courseId });
      setMessage('Class representative assigned to the course.');
      setUserId('');
      await load();
    } catch (e: any) {
      setMessage(e?.response?.data?.error || e.message || 'Could not assign representative.');
    } finally { setBusy(false); }
  }

  return <>
    <div className="heading"><div><span className="eyebrow">CLASS LEADERSHIP</span><h1>Class Representatives</h1><p>Assign a verified Class Representative account to one or more courses.</p></div></div>
    <section className="panel"><div className="panel-title"><div><span className="eyebrow">NEW ASSIGNMENT</span><h3>Assign representative</h3></div><Plus color="#43d8c2"/></div>
      <form onSubmit={assign}>
        <label>Representative account ID<input required value={userId} onChange={e => setUserId(e.target.value)} placeholder="Paste the user's account ID"/></label>
        <label>Course<select required value={courseId} onChange={e => setCourseId(e.target.value)}><option value="">Select course</option>{courses.map(c => <option key={c.id} value={c.id}>{c.code ? c.code + ' — ' : ''}{c.name}</option>)}</select></label>
        <button className="primary" disabled={busy || !courses.length}>{busy ? 'Assigning…' : 'Assign course'}</button>
      </form>
      <p className="hint">The account must first be assigned the Class Representative role under People & roles.</p>
    </section>
    <section className="panel"><div className="panel-title"><div><span className="eyebrow">CURRENT ASSIGNMENTS</span><h3>{assignments.length} course assignments</h3></div><Users color="#43d8c2"/></div>
      {assignments.length ? assignments.map(a => <div className="audit-row" key={a.id}><Users/><div><b>{a.representativeName}</b><small>{a.courseName} · {a.userId}</small></div></div>) : <div className="empty"><Users/><b>No class representatives assigned</b><small>Create the first course assignment above.</small></div>}
    </section>
    {message && <p className="message">{message}</p>}
  </>;
}
