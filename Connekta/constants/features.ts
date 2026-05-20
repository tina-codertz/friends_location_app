import { canUseMapbox } from '@/utils/maps-config';

/**
 * Feature flags — set in .env or EAS build env.
 * EXPO_PUBLIC_ENABLE_REALTIME=true to turn WebSocket live updates back on.
 */
export const ENABLE_REALTIME =
  process.env.EXPO_PUBLIC_ENABLE_REALTIME === 'true';

/** Poll friend locations via REST when tab is focused (always safe). */
export const ENABLE_FRIEND_LOCATION_POLL = true;

/** Location watch + ping only while Map tab is focused. */
export const ENABLE_MAP_LOCATION_TRACKING =
  process.env.EXPO_PUBLIC_ENABLE_MAP_TRACKING !== 'false';

/** Mapbox public token (pk.*) — primary map provider on iOS and Android. */
export function hasMapbox(): boolean {
  return canUseMapbox();
}
