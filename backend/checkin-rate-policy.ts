/** A check-in attempt window must be chronological and at most one minute old. */
export function checkInWindowActive(startedAt: unknown, nowMs: number, windowMs = 60_000): boolean {
  if (!Number.isSafeInteger(nowMs) || nowMs < 0 || !Number.isSafeInteger(windowMs) || windowMs < 1000 || windowMs > 300_000) return false;
  if (typeof startedAt !== 'number' || !Number.isSafeInteger(startedAt) || startedAt < 0 || startedAt > nowMs) return false;
  return nowMs - startedAt < windowMs;
}
