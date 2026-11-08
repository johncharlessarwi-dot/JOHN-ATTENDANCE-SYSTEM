import { it, expect } from 'vitest';
import { hasDuplicateCheckIn } from '../src/duplicate-checkin';
const rows = [{ studentId: 'T001', sessionId: 'CSC111-01' }];
it('detects duplicate check-in for the same session', () => { expect(hasDuplicateCheckIn(rows, rows[0])).toBe(true); expect(hasDuplicateCheckIn(rows, { studentId: 'T001', sessionId: 'CSC111-02' })).toBe(false); });
it('rejects missing identifiers', () => { expect(() => hasDuplicateCheckIn(rows, { studentId: '', sessionId: 'x' })).toThrow(); });

it('rejects malformed duplicate-check input',()=>{
 expect(()=>hasDuplicateCheckIn(null as never,{studentId:'x',sessionId:'s'})).toThrow(RangeError);
 expect(()=>hasDuplicateCheckIn([],{studentId:1 as never,sessionId:'s'})).toThrow(RangeError);
});
