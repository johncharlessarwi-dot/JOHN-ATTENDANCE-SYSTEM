import {it,expect} from 'vitest';
import {validCheckInCounter} from '../backend/checkin-counter-policy';
it('accepts bounded integer rate counters',()=>expect(validCheckInCounter(10)).toBe(true));
it('rejects negative persisted attempt counts',()=>expect(validCheckInCounter(-1)).toBe(false));
it('rejects coerced and noninteger count metadata',()=>{
 expect(validCheckInCounter('10')).toBe(false);
 expect(validCheckInCounter(1.5)).toBe(false);
});
it('rejects unrealistic request counts',()=>expect(validCheckInCounter(1001)).toBe(false));
