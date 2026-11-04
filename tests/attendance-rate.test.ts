import { it, expect } from 'vitest';
import { attendanceRate } from '../src/attendance-rate';
it('calculates percentages to one decimal', () => { expect(attendanceRate(2, 3)).toBe(66.7); expect(attendanceRate(0, 0)).toBe(0); });
it('rejects impossible totals', () => { expect(() => attendanceRate(4, 3)).toThrow(); expect(() => attendanceRate(-1, 2)).toThrow(); });
