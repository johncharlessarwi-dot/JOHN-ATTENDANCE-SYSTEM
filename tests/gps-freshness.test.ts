import { it, expect } from 'vitest';
import { isFreshGpsFix } from '../backend/gps-freshness';
it('accepts recent GPS fixes', () => { expect(isFreshGpsFix(98000, 100000)).toBe(true); });
it('rejects future or stale fixes', () => { expect(isFreshGpsFix(100001, 100000)).toBe(false); expect(isFreshGpsFix(0, 100000)).toBe(false); });
