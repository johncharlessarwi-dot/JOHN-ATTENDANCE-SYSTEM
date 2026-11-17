export type CheckInIdentity = { studentId: string; sessionId: string };
export function hasDuplicateCheckIn(rows: readonly CheckInIdentity[], candidate: CheckInIdentity): boolean {
  if (!Array.isArray(rows) || rows.length > 100000) throw new RangeError('Invalid check-in history');
  if (typeof candidate?.studentId !== 'string' || typeof candidate?.sessionId !== 'string' || !candidate.studentId.trim() || !candidate.sessionId.trim() || candidate.studentId.length > 128 || candidate.sessionId.length > 128) throw new RangeError('Missing check-in identity');
  if (rows.some(row => !row || typeof row.studentId !== 'string' || typeof row.sessionId !== 'string' || row.studentId.length > 128 || row.sessionId.length > 128 || !row.studentId.trim() || !row.sessionId.trim())) throw new RangeError('Malformed check-in history');
  return rows.some(row => row.studentId === candidate.studentId && row.sessionId === candidate.sessionId);
}
