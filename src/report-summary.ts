export type CheckInStatus = 'present' | 'late' | 'absent' | 'excused';
export function summarizeCheckInStatuses(statuses: readonly CheckInStatus[]) {
  if (!Array.isArray(statuses) || statuses.length > 100000) throw new RangeError('Invalid status dataset');
  const totals = { present: 0, late: 0, absent: 0, excused: 0 };
  for (const status of statuses) {
    if (!Object.prototype.hasOwnProperty.call(totals, status)) throw new RangeError('Unknown attendance status');
    totals[status] += 1;
  }
  return { ...totals, total: statuses.length };
}
