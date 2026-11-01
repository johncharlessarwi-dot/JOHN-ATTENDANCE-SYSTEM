/** Prevent spreadsheet formula evaluation while preserving CSV readability. */
export function csvCell(value: unknown): string {
  const raw = String(value ?? '');
  const escaped = /^[\s]*[=+\-@]/.test(raw) ? `'${raw}` : raw;
  return '"' + escaped.replace(/"/g, '""') + '"';
}

export function searchReportRows<T extends { course: string; studentId: string; venue: string }>(rows: T[], query: string): T[] {
  const term = query.trim().toLocaleLowerCase();
  if (!term) return rows;
  return rows.filter(row => [row.course, row.studentId, row.venue].some(value => value.toLocaleLowerCase().includes(term)));
}

export function filterReportStatus<T extends { status: string }>(rows: T[], status: string): T[] {
  return status ? rows.filter(row => row.status === status) : rows;
}

export function filterReportCourse<T extends { course: string }>(rows: T[], course: string): T[] {
  return course ? rows.filter(row => row.course === course) : rows;
}

export function filterReportDates<T extends { checkedInAt: number }>(rows: T[], from: string, to: string): T[] {
  const start = from ? new Date(`${from}T00:00:00`).getTime() : Number.NEGATIVE_INFINITY;
  const end = to ? new Date(`${to}T23:59:59.999`).getTime() : Number.POSITIVE_INFINITY;
  if (Number.isNaN(start) || Number.isNaN(end) || start > end) return [];
  return rows.filter(row => row.checkedInAt >= start && row.checkedInAt <= end);
}
