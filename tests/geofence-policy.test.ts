import { it, expect } from 'vitest';
import { validGeofenceRadius } from '../backend/geofence-policy';
it('accepts practical class radii', () => { expect(validGeofenceRadius(100)).toBe(true); expect(validGeofenceRadius(10)).toBe(true); });
it('rejects invalid radius values', () => { expect(validGeofenceRadius(0)).toBe(false); expect(validGeofenceRadius(1001)).toBe(false); expect(validGeofenceRadius(NaN)).toBe(false); });
