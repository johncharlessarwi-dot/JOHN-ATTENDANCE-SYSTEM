import { describe, expect, it } from 'vitest';
import { geofenceDistanceMeters, isReliableGpsFix } from '../backend/geo';

describe('classroom geolocation validation', () => {
  it('accepts a valid accurate GPS fix', () => {
    expect(isReliableGpsFix(-3.35, 37.35, 25)).toBe(true);
  });
  it('rejects negative accuracy, impossible coordinates and weak fixes', () => {
    expect(isReliableGpsFix(-3.35, 37.35, -1)).toBe(false);
    expect(isReliableGpsFix(100, 37.35, 10)).toBe(false);
    expect(isReliableGpsFix(-3.35, 37.35, 101)).toBe(false);
    expect(isReliableGpsFix(NaN, 37.35, 0)).toBe(false);
  });
});

it('measures geofence distances and fails closed for missing classroom coordinates', () => {
  expect(geofenceDistanceMeters(-3.35, 37.35, -3.35, 37.35)).toBe(0);
  expect(geofenceDistanceMeters(-3.35, 37.35, -3.36, 37.35)).toBeGreaterThan(1000);
  expect(Number.isNaN(geofenceDistanceMeters(-3.35, 37.35, NaN, 37.35))).toBe(true);
});

it('rejects unsafe accuracy thresholds',()=>{
 expect(isReliableGpsFix(0,0,500,Infinity)).toBe(false);
 expect(isReliableGpsFix(0,0,1,-1)).toBe(false);
});
