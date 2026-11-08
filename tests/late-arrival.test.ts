import { it, expect } from 'vitest';
import { latenessMinutes } from '../src/late-arrival';
it('applies grace without negative lateness', () => { expect(latenessMinutes(0, 11 * 60000, 5)).toBe(6); expect(latenessMinutes(0, -60000)).toBe(0); });
it('rejects malformed timing', () => { expect(() => latenessMinutes(0, NaN)).toThrow(); expect(() => latenessMinutes(0, 0, -1)).toThrow(); });

it('rejects negative and fractional attendance timestamps',()=>{
 expect(()=>latenessMinutes(-1,100)).toThrow(RangeError);
 expect(()=>latenessMinutes(1.5,200)).toThrow(RangeError);
});
