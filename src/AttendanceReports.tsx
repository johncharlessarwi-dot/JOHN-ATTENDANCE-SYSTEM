import { useEffect, useState } from 'react';
import { api } from '@appdeploy/client';
import * as XLSX from 'xlsx';
import { Download, FileSpreadsheet, RefreshCw, Search, ShieldCheck } from 'lucide-react';
import { csvCell, filterReportCourse, filterReportDates, filterReportGps, filterReportStatus, paginateReportRows, searchReportRows, sortReportRows, spreadsheetSafeText, type GpsFilter, type ReportSort } from './report-utils';

type Role = 'student' | 'lecturer' | 'class_rep' | 'administrator' | 'super_admin';
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

export default function AttendanceReports({ role }: { role: Role }) {
  const [data, setData] = useState<ReportData | null>(null);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [courseFilter, setCourseFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [gpsFilter, setGpsFilter] = useState<GpsFilter>('all');
  const [sortMode, setSortMode] = useState<ReportSort>('newest');
  const [page, setPage] = useState(1);
  const visibleRows = data ? sortReportRows(filterReportGps(filterReportDates(filterReportCourse(filterReportStatus(searchReportRows(data.rows, query), statusFilter), courseFilter), dateFrom, dateTo), gpsFilter), sortMode) : [];
  const pageData = paginateReportRows(visibleRows, page);
  const statusOptions = data ? [...new Set(data.rows.map(row => row.status))].sort() : [];
  const courseOptions = data ? [...new Set(data.rows.map(row => row.course))].sort() : [];
  const filtersActive = Boolean(query || statusFilter || courseFilter || dateFrom || dateTo || gpsFilter !== 'all' || sortMode !== 'newest');

  function resetFilters() {
    setQuery('');
    setStatusFilter('');
    setCourseFilter('');
    setDateFrom('');
    setDateTo('');
    setGpsFilter('all');
    setSortMode('newest');
    setPage(1);
  }

  async function load() {
    const response = await api.get('/api/reports/attendance');
    setData(response.data);
  }

  useEffect(() => {
    load().catch((e: any) => setMessage(e?.response?.data?.error || e.message || 'Could not load reports.'));
  }, []);

  function exportCsv() {
    if (!visibleRows.length) return;
    const headers = ['Attendance ID', 'Course', 'Student ID', 'Checked In At', 'Status', 'Venue', 'GPS Verified'];
    const rows = visibleRows.map(row => [row.id, row.course, row.studentId, stamp(row.checkedInAt), row.status, row.venue, row.locationVerified ? 'Yes' : 'No']);
    const csv = [headers, ...rows].map(row => row.map(csvCell).join(',')).join('\r\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'AFAMS-attendance-filtered.csv';
    anchor.click();
    URL.revokeObjectURL(url);
  }

  function exportExcel() {
    if (!visibleRows.length) return;
    const rows = visibleRows.map(row => ({ 'Attendance ID': spreadsheetSafeText(row.id), Course: spreadsheetSafeText(row.course), 'Student ID': spreadsheetSafeText(row.studentId), 'Checked In At': stamp(row.checkedInAt), Status: spreadsheetSafeText(row.status), Venue: spreadsheetSafeText(row.venue), 'GPS Verified': row.locationVerified ? 'Yes' : 'No' }));
    const sheet = XLSX.utils.json_to_sheet(rows);
    const book = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(book, sheet, 'Attendance');
    XLSX.writeFile(book, 'AFAMS-attendance-filtered.xlsx');
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
      <div className="toolbar-actions"><button className="outline" onClick={refresh}><RefreshCw size={16}/>{busy ? 'Refreshing…' : 'Refresh'}</button><button className="outline" onClick={() => window.print()}><FileSpreadsheet size={16}/> Save PDF</button><button className="outline" disabled={!visibleRows.length} onClick={exportExcel}><Download size={16}/> Export filtered Excel</button><button className="primary" disabled={!visibleRows.length} onClick={exportCsv}><Download size={16}/> Export filtered CSV</button></div>
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
        <div className="panel-title"><div><span className="eyebrow">DETAILED RECORDS</span><h3>{visibleRows.length} attendance records</h3></div></div>
        <div className="toolbar report-toolbar"><label className="search" aria-label="Search attendance records"><Search size={16}/><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search course, student or venue" /></label><label className="report-filter-label">Review status<select value={statusFilter} onChange={event => setStatusFilter(event.target.value)}><option value="">All statuses</option>{statusOptions.map(status => <option value={status} key={status}>{status}</option>)}</select></label><label className="report-filter-label">Course<select value={courseFilter} onChange={event => setCourseFilter(event.target.value)}><option value="">All courses</option>{courseOptions.map(course => <option value={course} key={course}>{course}</option>)}</select></label><label className="report-filter-label">From<input type="date" value={dateFrom} onChange={event => setDateFrom(event.target.value)} /></label><label className="report-filter-label">To<input type="date" min={dateFrom || undefined} value={dateTo} onChange={event => setDateTo(event.target.value)} /></label><label className="report-filter-label">GPS check<select value={gpsFilter} onChange={event => setGpsFilter(event.target.value as GpsFilter)}><option value="all">All records</option><option value="verified">GPS verified</option><option value="not-verified">No GPS verification</option></select></label><label className="report-filter-label">Sort<select value={sortMode} onChange={event => setSortMode(event.target.value as ReportSort)}><option value="newest">Newest first</option><option value="oldest">Oldest first</option><option value="course">Course A–Z</option></select></label><button className="outline" disabled={!filtersActive} onClick={resetFilters}>Clear filters</button></div>
        <div className="table-wrap"><table><thead><tr><th>COURSE</th><th>STUDENT ID</th><th>CHECKED IN</th><th>STATUS</th><th>GPS</th></tr></thead><tbody>{pageData.rows.map(row => <tr key={row.id}><td>{row.course}</td><td><code>{role === 'student' ? 'You' : row.studentId.slice(0, 12)}</code></td><td>{stamp(row.checkedInAt)}</td><td>{row.status}</td><td>{row.locationVerified ? 'Verified' : '—'}</td></tr>)}</tbody></table></div>
        <div className="report-pager"><span>Page {pageData.page} of {pageData.pages} · {pageData.total} records</span><div><button className="outline" disabled={pageData.page <= 1} onClick={() => setPage(pageData.page - 1)}>Previous</button><button className="outline" disabled={pageData.page >= pageData.pages} onClick={() => setPage(pageData.page + 1)}>Next</button></div></div>
      </section>
    </>}
  </>;
}
