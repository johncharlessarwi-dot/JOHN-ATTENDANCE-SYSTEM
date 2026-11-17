/** Fail closed when a persisted request counter is missing or corrupted. */
export function validCheckInCounter(value: unknown, maxTracked = 1000): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0 &&
    Number.isSafeInteger(maxTracked) && maxTracked >= 10 && maxTracked <= 10000 &&
    value <= maxTracked;
}
