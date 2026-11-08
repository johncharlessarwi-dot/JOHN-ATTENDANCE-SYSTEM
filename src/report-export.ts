import { csvCell } from './report-utils';
export function buildAttendanceCsv(columns: readonly string[], rows: readonly (readonly unknown[])[]): string {
  if (!Array.isArray(columns) || columns.length < 1 || columns.length > 30 || rows.length > 100000 || columns.some(column => typeof column !== 'string' || column.length > 120) || rows.some(row => !Array.isArray(row) || row.length !== columns.length || row.some(value => String(value ?? '').length > 32767))) throw new RangeError('Invalid CSV shape');
  return '\uFEFF' + [columns, ...rows].map(row => row.map(csvCell).join(',')).join('\r\n') + '\r\n';
}
