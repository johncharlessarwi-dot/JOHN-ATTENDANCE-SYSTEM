/** Reject stale or future browser GPS fixes before check-in. */
export function isFreshGpsFix(fixTimestampMs: number, nowMs = Date.now(), maxAgeMs = 30000): boolean {
  return Number.isFinite(fixTimestampMs) && Number.isFinite(nowMs) && Number.isSafeInteger(maxAgeMs)
    && maxAgeMs >= 1000 && maxAgeMs <= 120000
    && fixTimestampMs <= nowMs && nowMs - fixTimestampMs <= maxAgeMs;
}
