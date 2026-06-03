/** Min time between Firestore location pings (shared across map + app-open). */
export const MIN_LOCATION_PING_MS = 10_000;

let lastPingAt = 0;

export function canSendLocationPing(): boolean {
  return Date.now() - lastPingAt >= MIN_LOCATION_PING_MS;
}

export function markLocationPingSent(): void {
  lastPingAt = Date.now();
}
