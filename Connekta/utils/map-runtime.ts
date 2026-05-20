import { canUseMapbox } from '@/utils/maps-config';

type MapboxModule = typeof import('@rnmapbox/maps');

let mapboxModule: MapboxModule | null | undefined;

/** Safe load — Expo Go throws when native Mapbox is not linked. */
export function getMapboxModule(): MapboxModule | null {
  if (mapboxModule !== undefined) return mapboxModule;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require('@rnmapbox/maps') as MapboxModule;
    mapboxModule = mod?.default ? mod : mod;
  } catch {
    mapboxModule = null;
  }
  return mapboxModule;
}

export function isMapboxNativeAvailable(): boolean {
  return canUseMapbox() && getMapboxModule() != null;
}
