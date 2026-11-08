import {it,expect} from 'vitest';
import {normalizeSessionCode} from '../backend/session-code';
it('rejects ambiguous, malformed and coercible codes',()=>{
 expect(normalizeSessionCode('abcdef')).toBe('ABCDEF');
 expect(normalizeSessionCode('O0I1L2')).toBeNull();
 expect(normalizeSessionCode('A B C D')).toBeNull();
 expect(normalizeSessionCode(123456)).toBeNull();
});
