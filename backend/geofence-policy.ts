export function validGeofenceRadius(radiusMeters: number): boolean {
  return Number.isFinite(radiusMeters) && Number.isInteger(radiusMeters) && radiusMeters >= 10 && radiusMeters <= 1000;
}
