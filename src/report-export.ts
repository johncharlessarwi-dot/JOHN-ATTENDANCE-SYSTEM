import { csvCell } from './report-utils';
export function buildAttendanceCsv(columns: readonly string[], rows: readonly (readonly unknown[])[]): string {
  if (!Array.isArray(columns) || columns.length < 1 || columns.length > 30 || rows.length > 20000 || columns.some(column => typeof column !== 'string' || column.length > 120 || !column.trim()) || rows.some(row => !Array.isArray(row) || row.length !== columns.length || row.some(value => String(value ?? '').length > 32767))) throw new RangeError('Invalid CSV shape');
  if (new Set(columns.map(col=>col.trim().toLocaleLowerCase())).size !== columns.length) throw new RangeError('Duplicate CSV columns');
  let budget=columns.reduce((sum,col)=>sum+col.length,0);
  for(const row of rows){for(const value of row){budget+=String(value??'').length;if(budget>5_000_000)throw new RangeError('CSV export exceeds 5MB safety budget');}}
  return '\uFEFF' + [columns, ...rows].map(row => row.map(csvCell).join(',')).join('\r\n') + '\r\n';
}
