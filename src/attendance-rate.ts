export function attendanceRate(present: number, total: number): number {
  if (!Number.isSafeInteger(present) || !Number.isSafeInteger(total) || present < 0 || total < 0 || present > total) throw new RangeError('Invalid attendance counts');
  return total === 0 ? 0 : Math.round((present / total) * 1000) / 10;
}
