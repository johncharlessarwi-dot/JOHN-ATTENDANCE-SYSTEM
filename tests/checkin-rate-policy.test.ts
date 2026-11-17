import {it,expect} from 'vitest';
import {checkInWindowActive} from '../backend/checkin-rate-policy';
it('allows a chronological attempt within the current window',()=>{
 expect(checkInWindowActive(90000,100000)).toBe(true);
});
