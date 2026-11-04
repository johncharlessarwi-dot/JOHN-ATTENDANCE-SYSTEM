import { it, expect } from 'vitest';
import { summarizeCheckInStatuses } from '../src/report-summary';
it('summarizes all known statuses', () => { expect(summarizeCheckInStatuses(['present', 'late', 'absent'])).toEqual({ present: 1, late: 1, absent: 1, excused: 0, total: 3 }); });
it('rejects unknown values', () => { expect(() => summarizeCheckInStatuses(['unknown' as 'present'])).toThrow(); });
