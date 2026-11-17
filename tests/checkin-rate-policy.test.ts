import {it,expect} from 'vitest';
import {checkInWindowActive} from '../backend/checkin-rate-policy';
it('allows a chronological attempt within the current window',()=>{
 expect(checkInWindowActive(90000,100000)).toBe(true);
});

it('rejects a future-dated rate-limit record',()=>{
 expect(checkInWindowActive(100001,100000)).toBe(false);
});

it('rejects nonnumeric or malformed counter timestamps',()=>{
 expect(checkInWindowActive('1000',100000)).toBe(false);
 expect(checkInWindowActive(NaN,100000)).toBe(false);
});

it('expires windows after sixty seconds',()=>{
 expect(checkInWindowActive(40000,100000)).toBe(false);
});
