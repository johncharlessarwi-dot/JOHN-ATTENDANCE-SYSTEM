/** Prevent spreadsheet formula evaluation while preserving CSV readability. */
export function csvCell(value: unknown): string {
  const raw = String(value ?? '');
  const escaped = /^[\s]*[=+\-@]/.test(raw) ? `'${raw}` : raw;
  return '"' + escaped.replace(/"/g, '""') + '"';
}
