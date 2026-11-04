import { it, expect } from 'vitest';
import { attendanceStreak } from '../src/attendance-streak';
it('counts consecutive recent sessions', () => { expect(attendanceStreak([true, true, false, true])).toBe(2); expect(attendanceStreak([])).toBe(0); });
it('rejects invalid history', () => { expect(() => attendanceStreak(['yes'] as unknown as boolean[])).toThrow(); });
