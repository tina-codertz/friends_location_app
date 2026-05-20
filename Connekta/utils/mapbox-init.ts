import Mapbox from '@rnmapbox/maps';
import { getMapboxAccessToken } from '@/utils/maps-config';

let configured = false;

/** Call once at app start (root layout). */
export function ensureMapboxConfigured(): boolean {
  if (configured) return true;
  const token = getMapboxAccessToken();
  if (!token) return false;
  Mapbox.setAccessToken(token);
  configured = true;
  return true;
}
