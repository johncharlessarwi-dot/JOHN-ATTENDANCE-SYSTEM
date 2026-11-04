import { it, expect } from 'vitest';
import { isFreshGpsFix } from '../backend/gps-freshness';
it('accepts recent GPS fixes', () => { expect(isFreshGpsFix(98000, 100000)).toBe(true); });
it('rejects future or stale fixes', () => { expect(isFreshGpsFix(100001, 100000)).toBe(false); expect(isFreshGpsFix(0, 100000)).toBe(false); });

it('rejects negative, fractional and unsafe timestamps', () => {
  for (const timestamp of [-1, 1000.5, Number.MAX_SAFE_INTEGER + 1, NaN, Infinity]) {
    expect(isFreshGpsFix(timestamp, 100000)).toBe(false);
  }
  expect(isFreshGpsFix(1000, -1)).toBe(false);
  expect(isFreshGpsFix(1000, 1000.5)).toBe(false);
});
