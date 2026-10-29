import { useEffect, useState } from 'react';
import { api } from '@appdeploy/client';
import { BookOpen, Building2, GraduationCap, Layers3, Plus, RefreshCw, Trash2, Users } from 'lucide-react';

type Item = { id: string; name?: string; code?: string; facultyId?: string; departmentId?: string; programmeId?: string; courseId?: string; studentId?: string; award?: string; credits?: number; academicYear?: string; startDate?: string; endDate?: string; status?: string };
type Data = { faculties: Item[]; departments: Item[]; programmes: Item[]; courses: Item[]; semesters: Item[]; enrollments: Item[]; canManage: boolean };
const kinds = [
  { id: 'faculties', label: 'Faculties', icon: Building2 },
  { id: 'departments', label: 'Departments', icon: Layers3 },
  { id: 'programmes', label: 'Programmes', icon: GraduationCap },
  { id: 'courses', label: 'Courses', icon: BookOpen },
  { id: 'semesters', label: 'Semesters', icon: RefreshCw },
  { id: 'enrollments', label: 'Enrollments', icon: Users },
];
export default function AcademicAdmin() {
  const [data, setData] = useState<Data>({ faculties: [], departments: [], programmes: [], courses: [], semesters: [], enrollments: [], canManage: false });
  const [kind, setKind] = useState('faculties');
  const [form, setForm] = useState<Record<string,string>>({ name:'', code:'', facultyId:'', departmentId:'', programmeId:'', courseId:'', studentId:'', award:'Bachelor Degree', credits:'3', academicYear:'', startDate:'', endDate:'' });
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  async function load() {
    const r = await api.get('/api/academic');
    setData(r.data);
  }
  useEffect(() => { load().catch((e:any) => setMessage(e?.response?.data?.error || e.message || 'Could not load academic records.')); }, []);
  function change(key:string, value:string) { setForm(old => ({ ...old, [key]: value })); }
  async function save(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setMessage('');
    try {
      const payload:Record<string,unknown> = { kind, ...form };
      if (kind === 'enrollments') { delete payload.name; delete payload.code; }
      if (kind === 'semesters') delete payload.code;
      await api.post('/api/academic', payload);
      setMessage('Academic record saved successfully.');
      setForm(old => ({ ...old, name:'', code:'', studentId:'' }));
      await load();
    } catch (e:any) { setMessage(e?.response?.data?.error || e.message || 'Save failed.'); }
    finally { setBusy(false); }
  }
  async function remove(item:Item) {
    if (!window.confirm('Delete this academic record? Related records may need review.')) return;
    setBusy(true); setMessage('');
    try { await api.delete('/api/academic/' + kind + '/' + encodeURIComponent(item.id)); setMessage('Record deleted.'); await load(); }
    catch(e:any) { setMessage(e?.response?.data?.error || e.message || 'Delete failed.'); }
    finally { setBusy(false); }
  }
  const rows = data[kind as keyof Pick<Data,'faculties'|'departments'|'programmes'|'courses'|'semesters'|'enrollments'>] || [];
  const select = (key:string, label:string, options:Item[]) => <label>{label}<select required value={form[key] || ''} onChange={e=>change(key,e.target.value)}><option value="">Select {label.toLowerCase()}</option>{options.map(x=><option key={x.id} value={x.id}>{x.name || x.id}</option>)}</select></label>;
  return <><div className="heading"><div><span className="eyebrow">INSTITUTIONAL STRUCTURE</span><h1>Academic administration</h1><p>Set up the academic structure before assigning students to courses.</p></div><button className="outline" onClick={()=>load()}><RefreshCw size={16}/> Refresh</button></div>
    <div className="metrics">{kinds.map(k=><button key={k.id} className="metric" onClick={()=>setKind(k.id)} style={{textAlign:'left',border:kind===k.id?'1px solid #43d8c2':undefined,cursor:'pointer'}}><div><k.icon size={18}/></div><b>{data[k.id as keyof Data]?.length || 0}</b><span>{k.label}</span><small>{kind===k.id?'SELECTED':'OPEN MODULE'}</small></button>)}</div>
    <div className="columns"><section className="panel"><div className="panel-title"><div><span className="eyebrow">CREATE RECORD</span><h3>{kinds.find(k=>k.id===kind)?.label}</h3></div><Plus color="#43d8c2"/></div>
      {data.canManage ? <form onSubmit={save}>
        {kind !== 'enrollments' && <label>Name / title<input required minLength={2} value={form.name} onChange={e=>change('name',e.target.value)} placeholder="Enter name or title"/></label>}
        {kind !== 'semesters' && kind !== 'enrollments' && <label>Code<input value={form.code} onChange={e=>change('code',e.target.value.toUpperCase())} placeholder="Optional code"/></label>}
        {kind==='departments' && select('facultyId','Faculty',data.faculties)}
        {kind==='programmes' && <>{select('departmentId','Department',data.departments)}<label>Award<input value={form.award} onChange={e=>change('award',e.target.value)}/></label></>}
        {kind==='courses' && <>{select('programmeId','Programme',data.programmes)}<label>Credit units<input type="number" min="0" max="60" value={form.credits} onChange={e=>change('credits',e.target.value)}/></label></>}
        {kind==='semesters' && <><label>Academic year<input required value={form.academicYear} onChange={e=>change('academicYear',e.target.value)} placeholder="2026/2027"/></label><label>Start date<input type="date" required value={form.startDate} onChange={e=>change('startDate',e.target.value)}/></label><label>End date<input type="date" required value={form.endDate} onChange={e=>change('endDate',e.target.value)}/></label></>}
        {kind==='enrollments' && <>{select('courseId','Course',data.courses)}<label>Student account ID<input required value={form.studentId} onChange={e=>change('studentId',e.target.value)} placeholder="Student must sign in first"/></label></>}
        <button className="primary" disabled={busy}>{busy?'Saving…':'Save record'}</button>
      </form> : <p className="hint">Read-only view. Academic record management is restricted to Administrator and Super Admin.</p>}
      {message && <p className="message">{message}</p>}
    </section><section className="panel"><div className="panel-title"><div><span className="eyebrow">REGISTERED RECORDS</span><h3>{rows.length} {kinds.find(k=>k.id===kind)?.label}</h3></div></div>
      {rows.length ? rows.map(item=><div className="audit-row" key={item.id}><BookOpen/><div><b>{item.name || item.studentId}</b><small>{item.code || item.academicYear || item.award || item.status || item.id}{item.startDate ? ' · '+item.startDate+' — '+item.endDate : ''}</small></div>{data.canManage && <button className="icon" disabled={busy} onClick={()=>remove(item)} title="Delete record"><Trash2 size={16}/></button>}</div>) : <div className="empty"><BookOpen/><b>No records yet</b><small>Create the first record in this module.</small></div>}
    </section></div>
  </>;
}
