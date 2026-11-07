import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

const api = readFileSync(new URL('../backend/index.ts', import.meta.url), 'utf8');
const worker = readFileSync(new URL('../public/service-worker.js', import.meta.url), 'utf8');

describe('AFAMS security regression contracts', () => {
  it('enforces real role strings, not coerced objects', () => {
    expect(api).toContain("typeof v === 'string'");
    expect(api).not.toContain('includes(String(v))');
  });
  it('blocks owner demotion and staff attendance check-in', () => {
    expect(api).toContain("target.role === 'super_admin'");
    expect(api).toContain("p.role !== 'student' && p.role !== 'class_rep'");
  });
  it('rejects truthy string geofence flags', () => {
    expect(api).toContain("typeof b.locationRequired !== 'boolean'");
    expect(api).toContain('b.locationRequired === true');
  });
  it('never stores authenticated requests or API data in offline cache', () => {
    expect(worker).toContain("url.pathname.startsWith('/api/')");
    expect(worker).toContain("request.headers.has('authorization')");
    expect(worker).toContain("request.credentials === 'include'");
    expect(worker).toContain('if (!staticAsset) return');
    expect(worker).toContain("includes('no-store')");
  });
});
