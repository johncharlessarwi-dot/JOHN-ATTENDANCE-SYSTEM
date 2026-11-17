import { it, expect } from 'vitest';
import { latenessMinutes } from '../src/late-arrival';
it('applies grace without negative lateness', () => { expect(latenessMinutes(0, 11 * 60000, 5)).toBe(6); expect(latenessMinutes(0, 0)).toBe(0); });
it('rejects malformed timing', () => { expect(() => latenessMinutes(0, NaN)).toThrow(); expect(() => latenessMinutes(0, 0, -1)).toThrow(); });

it('rejects fractional and pre-epoch attendance timestamps',()=>{
 expect(()=>latenessMinutes(-1,100)).toThrow(RangeError);
 expect(()=>latenessMinutes(1.5,200)).toThrow(RangeError);
});

it('rejects negative attendance timestamps',()=>{
 expect(()=>latenessMinutes(-1, 1000)).toThrow(RangeError);
 expect(()=>latenessMinutes(1000, -1)).toThrow(RangeError);
});

it('rejects fractional grace periods',()=>{
 expect(()=>latenessMinutes(0,1000,0.5)).toThrow(RangeError);
});
