export function latenessMinutes(scheduledStartMs: number, checkInMs: number, graceMinutes = 0): number {
  if (![scheduledStartMs, checkInMs, graceMinutes].every(Number.isFinite) || graceMinutes < 0 || graceMinutes > 60) throw new RangeError('Invalid attendance timing');
  return Math.max(0, Math.ceil((checkInMs - scheduledStartMs) / 60000) - Math.floor(graceMinutes));
}
