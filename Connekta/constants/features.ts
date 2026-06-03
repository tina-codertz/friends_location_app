/** Location watch + ping only while Map tab is focused. */
export const ENABLE_MAP_LOCATION_TRACKING =
  process.env.EXPO_PUBLIC_ENABLE_MAP_TRACKING !== 'false';

/** Ping Firestore on app open / return to foreground when sharing is on. */
export const ENABLE_APP_OPEN_LOCATION_PING =
  process.env.EXPO_PUBLIC_ENABLE_APP_OPEN_PING !== 'false';
