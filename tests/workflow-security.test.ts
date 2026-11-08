import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
const workflow=readFileSync(new URL('../.github/workflows/afams-build.yml',import.meta.url),'utf8');
describe('CI security contract',()=>{
 it('limits token and persisted credentials',()=>{
  expect(workflow).toContain('contents: read');
  expect(workflow).toContain('persist-credentials: false');
 });
 it('bounds work and runs locked dependencies',()=>{
  expect(workflow).toContain('timeout-minutes: 20');
  expect(workflow).toContain('cancel-in-progress: true');
  expect(workflow).toContain('npm ci');
 });
});
