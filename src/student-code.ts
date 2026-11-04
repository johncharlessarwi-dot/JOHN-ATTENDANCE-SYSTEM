/** Preserve case-sensitive student IDs but reject unsafe characters. */
export function normalizeStudentCode(value: string): string {
  if (typeof value !== 'string') throw new TypeError('Student ID must be text');
  const normalized = value.trim().replace(/\s+/g, '');
  if (!/^[A-Za-z0-9/_-]{3,40}$/.test(normalized)) throw new RangeError('Invalid student registration code');
  return normalized;
}
