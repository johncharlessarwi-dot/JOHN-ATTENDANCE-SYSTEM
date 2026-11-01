/** Reject impossible or untrustworthy browser GPS fixes before check-in. */
export function isReliableGpsFix(latitude: number, longitude: number, accuracy: number, maxAccuracyMeters = 100): boolean {
  return Number.isFinite(latitude) && latitude >= -90 && latitude <= 90
    && Number.isFinite(longitude) && longitude >= -180 && longitude <= 180
    && Number.isFinite(accuracy) && accuracy >= 0 && accuracy <= maxAccuracyMeters;
}
