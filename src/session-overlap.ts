export type SessionWindow = { startsAt: number; endsAt: number };
export function sessionsOverlap(a: SessionWindow, b: SessionWindow): boolean {
  for (const value of [a.startsAt, a.endsAt, b.startsAt, b.endsAt]) if (!Number.isFinite(value)) throw new RangeError('Invalid session time');
  if (a.endsAt <= a.startsAt || b.endsAt <= b.startsAt) throw new RangeError('Invalid session duration');
  return a.startsAt < b.endsAt && b.startsAt < a.endsAt;
}
