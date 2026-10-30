import { useEffect, useState } from 'react';
import { api } from '@appdeploy/client';
import { BookOpen, ClipboardList, Users } from 'lucide-react';

type Data = {
  courses: { id: string; name: string; code: string; students: number; verified: number; pending: number; rejected: number }[];
  students: { userId: string; name: string; verified: number; pending: number; rejected: number }[];
  summary: { courses: number; students: number; verified: number; pending: number };
  note: string;
};

export default function ClassRepDashboard() {
  const [data, setData] = useState<Data | null>(null);
  const [message, setMessage] = useState('');
  useEffect(() => {
    api.get('/api/class-rep/dashboard').then(r => setData(r.data)).catch((e: any) => setMessage(e?.response?.data?.error || e.message || 'Could not load CR dashboard.'));
  }, []);
  return <>
    <div className="heading"><div><span className="eyebrow">CLASS REPRESENTATIVE WORKSPACE</span><h1>CR Dashboard</h1><p>Track the courses and students assigned to your representative account.</p></div></div>
    {message && <p className="message">{message}</p>}
    {data && <>
      <div className="metrics">
        <div className="metric"><div><BookOpen/></div><b>{data.summary.courses}</b><span>Assigned courses</span><small>YOUR SCOPE</small></div>
        <div className="metric"><div><Users/></div><b>{data.summary.students}</b><span>Enrolled students</span><small>YOUR COURSES</small></div>
        <div className="metric"><div><ClipboardList/></div><b>{data.summary.verified}</b><span>Verified records</span><small>LECTURER APPROVED</small></div>
        <div className="metric"><div><ClipboardList/></div><b>{data.summary.pending}</b><span>Pending review</span><small>AWAITING LECTURER</small></div>
      </div>
      <section className="panel"><div className="panel-title"><div><span className="eyebrow">COURSE OVERVIEW</span><h3>Assigned courses</h3></div></div>
        {data.courses.length ? data.courses.map(c => <div className="audit-row" key={c.id}><BookOpen/><div><b>{c.code ? c.code + ' · ' : ''}{c.name}</b><small>{c.students} students · {c.verified} verified · {c.pending} pending · {c.rejected} rejected</small></div></div>) : <div className="empty"><BookOpen/><b>No courses assigned</b><small>Ask your administrator to assign your representative account to a course.</small></div>}
      </section>
      <section className="panel"><div className="panel-title"><div><span className="eyebrow">CLASS ROSTER</span><h3>Enrolled students</h3></div></div>
        {data.students.length ? <div className="table-wrap"><table><thead><tr><th>STUDENT</th><th>VERIFIED</th><th>PENDING</th><th>REJECTED</th></tr></thead><tbody>{data.students.map(s => <tr key={s.userId}><td>{s.name}</td><td>{s.verified}</td><td>{s.pending}</td><td>{s.rejected}</td></tr>)}</tbody></table></div> : <div className="empty"><Users/><b>No enrolled students found</b><small>Student enrollments will appear when administrators register them.</small></div>}
      </section>
      <p className="hint">{data.note}</p>
    </>}
  </>;
}
