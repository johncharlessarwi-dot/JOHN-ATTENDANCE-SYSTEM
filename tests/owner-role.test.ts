import { describe,it,expect } from 'vitest';
import {effectiveAccountRole} from '../backend/owner-role';
describe('owner role hardening',()=>{
 it('downgrades stored super-admin if email no longer allowlisted',()=>expect(effectiveAccountRole('super_admin','other@example.com',['owner@example.com'])).toBe('student'));
 it('keeps allowlisted owner regardless of prior role',()=>expect(effectiveAccountRole('student','OWNER@example.com',['owner@example.com'])).toBe('super_admin'));
 it('rejects undefined owner email',()=>expect(effectiveAccountRole('super_admin',undefined,['owner@example.com'])).toBe('student'));
});

it('normalizes legitimate administrator email capitalization and spaces',()=>{
 expect(effectiveAccountRole('student','OWNER@EXAMPLE.COM',[' owner@example.com '])).toBe('super_admin');
});

it('never elevates a blank authenticated email',()=>{
 expect(effectiveAccountRole('student',' ',[' '])).toBe('student');
});

it.each([undefined, null, 'former_role', 'ADMINISTRATOR', ['administrator']])('limits an unrecognized stored role (%j) to student access', role => {
  expect(effectiveAccountRole(role, 'learner@example.test', ['owner@example.test'])).toBe('student');
});

it.each(['student', 'lecturer', 'class_rep', 'administrator'])('preserves a recognized non-owner role (%s)', role => {
  expect(effectiveAccountRole(role, 'member@example.test', ['owner@example.test'])).toBe(role);
});
