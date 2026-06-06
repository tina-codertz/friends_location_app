import {
  canUseGoogleMapsOnPlatform,
  canUseMapbox,
  getMapProviderPreference,
} from '@/utils/maps-config';
import { ensureMapboxConfigured } from '@/utils/mapbox-init';
import { isMapboxNativeAvailable } from '@/utils/map-runtime';

/** How the app renders maps — pick exactly one path per ConnektaMap instance. */
export type MapEngineKind = 'google-maps' | 'mapbox-gl' | 'mapbox-raster' | 'unavailable';

let cachedEngine: MapEngineKind | null = null;

/**
 * Single source of truth: native Mapbox GL, or react-native-maps + Mapbox tiles only
 * (never both native base map and Mapbox tiles at once).
 */
export function resolveMapEngine(): MapEngineKind {
  if (cachedEngine) return cachedEngine;

  if (getMapProviderPreference() === 'google') {
    cachedEngine = canUseGoogleMapsOnPlatform() ? 'google-maps' : 'unavailable';
    return cachedEngine;
  }

  if (!canUseMapbox()) {
    cachedEngine = 'unavailable';
    return cachedEngine;
  }

  if (isMapboxNativeAvailable() && ensureMapboxConfigured()) {
    cachedEngine = 'mapbox-gl';
    return cachedEngine;
  }

  cachedEngine = 'mapbox-raster';
  return cachedEngine;
}

export function mapEngineLabel(engine: MapEngineKind): string {
  switch (engine) {
    case 'google-maps':
      return 'Google Maps';
    case 'mapbox-gl':
      return 'Mapbox GL';
    case 'mapbox-raster':
      return 'Mapbox tiles (fallback)';
    default:
      return 'unavailable';
  }
}
