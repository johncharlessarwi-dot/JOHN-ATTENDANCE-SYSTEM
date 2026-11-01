import { describe, expect, it } from 'vitest';
import { isReliableGpsFix } from '../backend/geo';

describe('classroom geolocation validation', () => {
  it('accepts a valid accurate GPS fix', () => {
    expect(isReliableGpsFix(-3.35, 37.35, 25)).toBe(true);
  });
  it('rejects negative accuracy, impossible coordinates and weak fixes', () => {
    expect(isReliableGpsFix(-3.35, 37.35, -1)).toBe(false);
    expect(isReliableGpsFix(100, 37.35, 10)).toBe(false);
    expect(isReliableGpsFix(-3.35, 37.35, 101)).toBe(false);
    expect(isReliableGpsFix(NaN, 37.35, 0)).toBe(false);
  });
});
