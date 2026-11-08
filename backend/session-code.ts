export function normalizeSessionCode(input: unknown): string | null {
  if (typeof input !== 'string' || input.length !== 6) return null;
  return /^[A-HJ-NP-Z2-9]{6}$/i.test(input) ? input.toUpperCase() : null;
}
