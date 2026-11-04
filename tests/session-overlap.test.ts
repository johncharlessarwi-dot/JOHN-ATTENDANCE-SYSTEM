import { it, expect } from 'vitest';
import { sessionsOverlap } from '../src/session-overlap';
it('detects real overlaps but allows adjacent classes', () => { expect(sessionsOverlap({ startsAt: 0, endsAt: 60 }, { startsAt: 30, endsAt: 90 })).toBe(true); expect(sessionsOverlap({ startsAt: 0, endsAt: 60 }, { startsAt: 60, endsAt: 90 })).toBe(false); });
it('rejects zero-length sessions', () => { expect(() => sessionsOverlap({ startsAt: 0, endsAt: 0 }, { startsAt: 1, endsAt: 2 })).toThrow(); });
