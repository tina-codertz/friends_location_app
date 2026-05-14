/**
 * Real-time transport placeholder.
 *
 * The app currently uses REST + polling (`useLiveFriendLocations`) for friend
 * coordinates. For WebSocket/SSE, replace the polling timer with a single
 * long-lived connection that emits: friend_request, friend_accepted,
 * location_update — and reconnect with backoff + a catch-up fetch on resume.
 */
export function useRealtimePlaceholder() {
  return null;
}
