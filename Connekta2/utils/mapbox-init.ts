import { getMapboxAccessToken } from '@/utils/maps-config';
import { getMapboxModule, isMapboxNativeAvailable } from '@/utils/map-runtime';

let configured = false;

/** Call before rendering Mapbox map (not at app import time). */
export function ensureMapboxConfigured(): boolean {
  if (!isMapboxNativeAvailable()) return false;
  if (configured) return true;
  const token = getMapboxAccessToken();
  if (!token) return false;
  const Mapbox = getMapboxModule();
  if (!Mapbox) return false;
  Mapbox.setAccessToken(token);
  configured = true;
  return true;
}
