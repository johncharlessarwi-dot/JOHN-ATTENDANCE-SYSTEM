export type CheckInIdentity = { studentId: string; sessionId: string };
export function hasDuplicateCheckIn(rows: readonly CheckInIdentity[], candidate: CheckInIdentity): boolean {
  if (!candidate?.studentId?.trim() || !candidate?.sessionId?.trim()) throw new RangeError('Missing check-in identity');
  return rows.some(row => row.studentId === candidate.studentId && row.sessionId === candidate.sessionId);
}
