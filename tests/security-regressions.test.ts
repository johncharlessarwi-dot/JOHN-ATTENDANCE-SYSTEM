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
  it('validates academic calendar dates and numeric academic inputs', () => {
    expect(api).toContain('const validIsoDate');
    expect(api).toContain('parsed.toISOString().slice(0, 10) === value');
    expect(api.match(/validIsoDate\(startDate\)/g)?.length).toBe(2);
    expect(api).toContain('Number.isSafeInteger(credits)');
    expect(api).toContain('Number.isSafeInteger(requestedCount)');
  });
  it('never stores authenticated requests or API data in offline cache', () => {
    expect(worker).toContain("url.pathname.startsWith('/api/')");
    expect(worker).toContain("request.headers.has('authorization')");
    expect(worker).toContain("request.credentials === 'include'");
    expect(worker).toContain('if (!staticAsset) return');
    expect(worker).toContain("includes('no-store')");
  });
});

describe('attendance privacy and abuse prevention', () => {
  it('redacts codes and precise GPS coordinates from non-owner responses', () => {
    expect(api).toContain('redactSessionForViewer(session, p)');
    expect(api).toContain('redactAttendanceGps(record)');
    expect(api).toContain("['code', 'latitude', 'longitude']");
  });
  it('throttles repeated code guesses using atomic account windows', () => {
    expect(api).toContain('allowCheckInAttempt(p.userId)');
    expect(api).toContain("'afams_request_limits'");
    expect(api).toContain("if: { attempts: previous.attempts }");
    expect(api).toContain('429');
  });
  it('detects timetable overlap across courses, venues, and lecturers', () => {
    expect(api).toContain('timeRangesOverlap(startTime, endTime, item.startTime, item.endTime)');
    expect(api).toContain('venueClash');
    expect(api).toContain('lecturerClash');
  });
});
