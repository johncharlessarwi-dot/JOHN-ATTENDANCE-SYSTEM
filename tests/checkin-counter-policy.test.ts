import {it,expect} from 'vitest';
import {validCheckInCounter} from '../backend/checkin-counter-policy';
it('accepts bounded integer rate counters',()=>expect(validCheckInCounter(10)).toBe(true));
it('rejects negative persisted attempt counts',()=>expect(validCheckInCounter(-1)).toBe(false));
