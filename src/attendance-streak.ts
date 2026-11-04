/** Count consecutive attended sessions from most recent to oldest. */
export function attendanceStreak(attendedNewestFirst: readonly boolean[]): number {
  if (!Array.isArray(attendedNewestFirst) || attendedNewestFirst.length > 10000 || attendedNewestFirst.some(value => typeof value !== 'boolean')) throw new RangeError('Invalid attendance history');
  let streak = 0;
  for (const attended of attendedNewestFirst) { if (!attended) break; streak++; }
  return streak;
}
