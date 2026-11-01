/** Reject impossible or untrustworthy browser GPS fixes before check-in. */
export function isReliableGpsFix(latitude: number, longitude: number, accuracy: number, maxAccuracyMeters = 100): boolean {
  return Number.isFinite(latitude) && latitude >= -90 && latitude <= 90
    && Number.isFinite(longitude) && longitude >= -180 && longitude <= 180
    && Number.isFinite(accuracy) && accuracy >= 0 && accuracy <= maxAccuracyMeters;
}

export function geofenceDistanceMeters(fromLat: number, fromLon: number, toLat: number, toLon: number): number {
  if (!isReliableGpsFix(fromLat, fromLon, 0) || !isReliableGpsFix(toLat, toLon, 0)) return NaN;
  const toRadians = (value: number) => value * Math.PI / 180;
  const latitudeDifference = toRadians(toLat - fromLat);
  const longitudeDifference = toRadians(toLon - fromLon);
  const a = Math.sin(latitudeDifference / 2) ** 2
    + Math.cos(toRadians(fromLat)) * Math.cos(toRadians(toLat)) * Math.sin(longitudeDifference / 2) ** 2;
  return 6371000 * 2 * Math.atan2(Math.sqrt(Math.min(1, a)), Math.sqrt(Math.max(0, 1 - a)));
}
