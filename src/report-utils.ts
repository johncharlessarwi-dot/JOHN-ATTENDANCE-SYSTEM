/** Prevent spreadsheet formula evaluation while preserving CSV readability. */
export function spreadsheetSafeText(value: unknown): string {
  const raw = String(value ?? '');
  return /^[\s\uFEFF\u200B\u200C\u200D\u200E\u200F\u2060\u202A-\u202E\u2066-\u2069]*[=+\-@]/.test(raw) ? `'${raw}` : raw;
}

export function csvCell(value: unknown): string {
  const escaped = spreadsheetSafeText(value);
  return '"' + escaped.replace(/"/g, '""') + '"';
}

export function searchReportRows<T extends { course: string; studentId: string; venue: string }>(rows: T[], query: string): T[] {
  if (typeof query !== 'string' || query.length > 200) throw new RangeError('Invalid report search');
  if (!Array.isArray(rows) || rows.length > 100000 || rows.some(row => !row || typeof row.course !== 'string' || typeof row.studentId !== 'string' || typeof row.venue !== 'string')) throw new RangeError('Invalid report records');
  const term = query.normalize('NFKC').trim().toLocaleLowerCase();
  if (!term) return rows;
  return rows.filter(row => [row.course, row.studentId, row.venue].some(value => value.normalize('NFKC').toLocaleLowerCase().includes(term)));
}

export function filterReportStatus<T extends { status: string }>(rows: T[], status: string): T[] {
  if (typeof status !== 'string' || status.length > 200) throw new RangeError('Invalid status filter');
  if (!Array.isArray(rows) || rows.length > 100000 || rows.some(row => !row || typeof row.status !== 'string')) throw new RangeError('Invalid status report rows');
  return status ? rows.filter(row => row.status === status) : rows;
}

export function filterReportCourse<T extends { course: string }>(rows: T[], course: string): T[] {
  if (typeof course !== 'string' || course.length > 200) throw new RangeError('Invalid course filter');
  if (!Array.isArray(rows) || rows.length > 100000 || rows.some(row => !row || typeof row.course !== 'string')) throw new RangeError('Invalid course report rows');
  return course ? rows.filter(row => row.course === course) : rows;
}

export function filterReportDates<T extends { checkedInAt: number }>(rows: T[], from: string, to: string): T[] {
  if (!Array.isArray(rows) || rows.length > 100000 || rows.some(row => !row || !Number.isSafeInteger(row.checkedInAt) || row.checkedInAt < 0)) throw new RangeError('Invalid date report rows');
  const start = from ? new Date(`${from}T00:00:00`).getTime() : Number.NEGATIVE_INFINITY;
  const end = to ? new Date(`${to}T23:59:59.999`).getTime() : Number.POSITIVE_INFINITY;
  const validDay = (value: string) => !value || /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;
  if (!validDay(from) || !validDay(to) || Number.isNaN(start) || Number.isNaN(end) || start > end) return [];
  return rows.filter(row => row.checkedInAt >= start && row.checkedInAt <= end);
}

export type GpsFilter = 'all' | 'verified' | 'not-verified';
export function filterReportGps<T extends { locationVerified: boolean }>(rows: T[], filter: GpsFilter): T[] {
  if (!['all','verified','not-verified'].includes(filter)) throw new RangeError('Unknown GPS filter');
  if (!Array.isArray(rows) || rows.length > 100000 || rows.some(row => !row || typeof row.locationVerified !== 'boolean')) throw new RangeError('Invalid GPS verification rows');
  if (filter === 'all') return rows;
  return rows.filter(row => row.locationVerified === (filter === 'verified'));
}

export type ReportSort = 'newest' | 'oldest' | 'course';
export function sortReportRows<T extends { checkedInAt: number; course: string }>(rows: T[], sort: ReportSort): T[] {
  if (!['newest', 'oldest', 'course'].includes(sort)) throw new RangeError('Unknown report sort');
  if (!Array.isArray(rows) || rows.length > 100000 || rows.some(row => !row || typeof row.course !== 'string' || !Number.isSafeInteger(row.checkedInAt) || row.checkedInAt < 0)) throw new RangeError('Invalid report sorting rows');
  return [...rows].sort((a, b) => sort === 'course'
    ? a.course.localeCompare(b.course) || b.checkedInAt - a.checkedInAt
    : sort === 'oldest' ? a.checkedInAt - b.checkedInAt : b.checkedInAt - a.checkedInAt);
}

export function paginateReportRows<T>(rows: T[], requestedPage: number, pageSize = 20) {
  if (!Array.isArray(rows) || rows.length > 100000) throw new RangeError('Invalid report pagination dataset');
  if (!Number.isSafeInteger(pageSize) || !Number.isSafeInteger(requestedPage)) throw new RangeError('Invalid page numbers');
  const safeSize = Math.max(1, Math.min(100, Math.floor(pageSize) || 20));
  const pages = Math.max(1, Math.ceil(rows.length / safeSize));
  const page = Math.max(1, Math.min(pages, Math.floor(requestedPage) || 1));
  const offset = (page - 1) * safeSize;
  return { rows: rows.slice(offset, offset + safeSize), page, pages, total: rows.length };
}
