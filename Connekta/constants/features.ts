/**
 * Supplemental map-dot updates while Map tab is focused.
 * Primary sharing pipeline is the background location task (see background-location.ts).
 * Permission UX and start/stop flows: services/location-sharing.ts.
 */
export const ENABLE_MAP_LOCATION_TRACKING =
  process.env.EXPO_PUBLIC_ENABLE_MAP_TRACKING !== 'false';

/** Ping Firestore on app open / return to foreground when sharing is on. */
export const ENABLE_APP_OPEN_LOCATION_PING =
  process.env.EXPO_PUBLIC_ENABLE_APP_OPEN_PING !== 'false';
