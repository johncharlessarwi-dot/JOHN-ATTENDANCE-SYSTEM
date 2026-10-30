import { useEffect, useState } from 'react';
import { api } from '@appdeploy/client';
import { CheckCircle2, Clock3, RefreshCw, ShieldCheck, XCircle } from 'lucide-react';

type RecordItem = {
  id: string;
  course: string;
  studentName: string;
  checkedInAt: number;
  status: string;
  sessionLocation?: string;
};

const stamp = (value: number) => new Date(value).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });

export default function AttendanceReview() {
  const [records, setRecords] = useState<RecordItem[]>([]);
  const [busyId, setBusyId] = useState('');
  const [message, setMessage] = useState('');

  async function load() {
    const response = await api.get('/api/attendance/review');
    setRecords(response.data.attendance || []);
  }

  useEffect(() => {
    load().catch((e: any) => setMessage(e?.response?.data?.error || e.message || 'Could not load attendance review queue.'));
  }, []);

  async function decide(record: RecordItem, status: 'Verified' | 'Rejected') {
    setBusyId(record.id);
    setMessage('');
    try {
      await api.post('/api/attendance/' + encodeURIComponent(record.id) + '/review', { status });
      setMessage('Attendance marked ' + status.toLowerCase() + '.');
      await load();
    } catch (e: any) {
      setMessage(e?.response?.data?.error || e.message || 'Could not update attendance.');
    } finally {
      setBusyId('');
    }
  }

  const pending = records.filter(record => record.status === 'Pending Verification');
  const reviewed = records.filter(record => record.status !== 'Pending Verification');

  return <>
    <div className="heading">
      <div><span className="eyebrow">LECTURER VERIFICATION</span><h1>Attendance review</h1><p>Approve valid check-ins or reject records that do not meet class requirements.</p></div>
      <button className="outline" onClick={() => load()}><RefreshCw size={16}/> Refresh</button>
    </div>
    {message && <p className="message">{message}</p>}
    <section className="panel">
      <div className="panel-title"><div><span className="eyebrow">ACTION REQUIRED</span><h3>{pending.length} pending records</h3></div><Clock3 color="#e6b85c"/></div>
      {pending.length ? pending.map(record => <div className="audit-row" key={record.id}>
        <Clock3/><div><b>{record.studentName} · {record.course}</b><small>{stamp(record.checkedInAt)}{record.sessionLocation ? ' · ' + record.sessionLocation : ''}</small></div>
        <button className="icon" disabled={busyId === record.id} title="Verify attendance" onClick={() => decide(record, 'Verified')}><CheckCircle2 color="#43d8c2"/></button>
        <button className="icon" disabled={busyId === record.id} title="Reject attendance" onClick={() => decide(record, 'Rejected')}><XCircle color="#ef7777"/></button>
      </div>) : <div className="empty"><ShieldCheck/><b>No pending check-ins</b><small>New student check-ins will appear here for review.</small></div>}
    </section>
    <section className="panel">
      <div className="panel-title"><div><span className="eyebrow">DECISIONS</span><h3>Reviewed records</h3></div></div>
      {reviewed.length ? reviewed.map(record => <div className="audit-row" key={record.id}>
        <ShieldCheck/><div><b>{record.studentName} · {record.course}</b><small>{stamp(record.checkedInAt)}</small></div>
        <span className={record.status === 'Verified' ? 'verified' : 'closed'}>{record.status}</span>
      </div>) : <div className="empty"><ShieldCheck/><b>No reviewed records</b><small>Completed verification decisions will appear here.</small></div>}
    </section>
  </>;
}
