import { useEffect, useState } from 'react';
import { api } from '@appdeploy/client';
import { Download, FileSpreadsheet, RefreshCw, ShieldCheck } from 'lucide-react';

type Role = 'student' | 'lecturer' | 'administrator' | 'super_admin';
type ReportRow = {
  id: string;
  course: string;
  studentId: string;
  checkedInAt: number;
  status: string;
  venue: string;
  locationVerified: boolean;
};
type ReportData = {
  summary: { total: number; verified: number; pending: number; rejected: number; gpsVerified: number };
  byCourse: { course: string; total: number; verified: number; pending: number; rejected: number }[];
  rows: ReportRow[];
};

const stamp = (value: number) => new Date(value).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });

function csvCell(value: unknown) {
  const text = String(value ?? '');
  return '"' + text.replace(/"/g, '""') + '"';
}

export default function AttendanceReports({ role }: { role: Role }) {
  const [data, setData] = useState<ReportData | null>(null);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  async function load() {
    const response = await api.get('/api/reports/attendance');
    setData(response.data);
  }

  useEffect(() => {
    load().catch((e: any) => setMessage(e?.response?.data?.error || e.message || 'Could not load reports.'));
  }, []);

  function exportCsv() {
    if (!data) return;
    const headers = ['Attendance ID', 'Course', 'Student ID', 'Checked In At', 'Status', 'Venue', 'GPS Verified'];
    const rows = data.rows.map(row => [row.id, row.course, row.studentId, stamp(row.checkedInAt), row.status, row.venue, row.locationVerified ? 'Yes' : 'No']);
    const csv = [headers, ...rows].map(row => row.map(csvCell).join(',')).join('\r\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'AFAMS-attendance-report.csv';
    anchor.click();
    URL.revokeObjectURL(url);
  }

  async function refresh() {
    setBusy(true);
    try { await load(); setMessage('Report refreshed.'); }
    catch (e: any) { setMessage(e?.response?.data?.error || e.message || 'Refresh failed.'); }
    finally { setBusy(false); }
  }

  return <>
    <div className="heading">
      <div><span className="eyebrow">ACADEMIC PERFORMANCE DATA</span><h1>Attendance reports</h1><p>{role === 'student' ? 'Your personal attendance history.' : 'Review attendance outcomes and export records for analysis.'}</p></div>
      <div className="toolbar-actions"><button className="outline" onClick={refresh}><RefreshCw size={16}/>{busy ? 'Refreshing…' : 'Refresh'}</button><button className="primary" disabled={!data?.rows.length} onClick={exportCsv}><Download size={16}/> Export CSV</button></div>
    </div>
    {message && <p className="message">{message}</p>}
    {data && <>
      <div className="metrics">
        <div className="metric"><div><FileSpreadsheet/></div><b>{data.summary.total}</b><span>Total check-ins</span><small>VISIBLE RECORDS</small></div>
        <div className="metric"><div><ShieldCheck/></div><b>{data.summary.verified}</b><span>Verified</span><small>APPROVED</small></div>
        <div className="metric"><div><RefreshCw/></div><b>{data.summary.pending}</b><span>Pending review</span><small>AWAITING DECISION</small></div>
        <div className="metric"><div><ShieldCheck/></div><b>{data.summary.gpsVerified}</b><span>GPS verified</span><small>GEOFENCE CHECKS</small></div>
      </div>
      <section className="panel">
        <div className="panel-title"><div><span className="eyebrow">COURSE BREAKDOWN</span><h3>Attendance records by course</h3></div></div>
        {data.byCourse.length ? data.byCourse.map(course => <div className="audit-row" key={course.course}><FileSpreadsheet/><div><b>{course.course}</b><small>{course.total} records · {course.verified} verified · {course.pending} pending · {course.rejected} rejected</small></div></div>) : <div className="empty"><FileSpreadsheet/><b>No report data</b><small>Attendance records will appear here when students check in.</small></div>}
      </section>
      <section className="panel">
        <div className="panel-title"><div><span className="eyebrow">DETAILED RECORDS</span><h3>{data.rows.length} attendance records</h3></div></div>
        <div className="table-wrap"><table><thead><tr><th>COURSE</th><th>STUDENT ID</th><th>CHECKED IN</th><th>STATUS</th><th>GPS</th></tr></thead><tbody>{data.rows.map(row => <tr key={row.id}><td>{row.course}</td><td><code>{role === 'student' ? 'You' : row.studentId.slice(0, 12)}</code></td><td>{stamp(row.checkedInAt)}</td><td>{row.status}</td><td>{row.locationVerified ? 'Verified' : '—'}</td></tr>)}</tbody></table></div>
      </section>
    </>}
  </>;
}
