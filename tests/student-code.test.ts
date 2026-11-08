import { it, expect } from 'vitest';
import { normalizeStudentCode } from '../src/student-code';
it('preserves Tanzania registration formats', () => { expect(normalizeStudentCode(' T/DEG/2025/0817 ')).toBe('T/DEG/2025/0817'); });
it('rejects unsafe identifiers', () => { expect(() => normalizeStudentCode('../')).toThrow(); expect(() => normalizeStudentCode('')).toThrow(); });

it('rejects ambiguous registration codes with internal spaces',()=>{
 expect(()=>normalizeStudentCode('T/DEG/2025/ 0817')).toThrow(RangeError);
});
