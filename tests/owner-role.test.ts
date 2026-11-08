import { describe,it,expect } from 'vitest';
import {effectiveAccountRole} from '../backend/owner-role';
describe('owner role hardening',()=>{
 it('downgrades stored super-admin if email no longer allowlisted',()=>expect(effectiveAccountRole('super_admin','other@example.com',['owner@example.com'])).toBe('student'));
 it('keeps allowlisted owner regardless of prior role',()=>expect(effectiveAccountRole('student','OWNER@example.com',['owner@example.com'])).toBe('super_admin'));
 it('rejects undefined owner email',()=>expect(effectiveAccountRole('super_admin',undefined,['owner@example.com'])).toBe('student'));
});
