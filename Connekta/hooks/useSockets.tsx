/**
 * Realtime events are delivered over WebSockets via the `RealtimeHub` Durable Object.
 *
 * - Endpoint: `GET wss://<worker>/realtime/ws?token=<JWT>`
 * - Events: `friend_request`, `friend_accepted`, `location_update` (see server broadcast payloads)
 * - Client: `getRealtimeWebSocketUrl` + `useLiveFriendLocations` (map) — add similar hooks for friends UI if needed
 */

export function useSocketsPlaceholder() {
  return null;
}
