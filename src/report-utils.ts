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
