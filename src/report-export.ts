import { csvCell } from './report-utils';
export function buildAttendanceCsv(columns: readonly string[], rows: readonly (readonly unknown[])[]): string {
  if (!Array.isArray(columns) || columns.length < 1 || columns.length > 30 || rows.length > 100000 || rows.some(row => row.length !== columns.length)) throw new RangeError('Invalid CSV shape');
  return '\uFEFF' + [columns, ...rows].map(row => row.map(csvCell).join(',')).join('\r\n') + '\r\n';
}
