import Constants from 'expo-constants';
import { canUseMapbox } from '@/utils/maps-config';

type MapboxModule = typeof import('@rnmapbox/maps');

let mapboxModule: MapboxModule | null | undefined;

/** Expo Go cannot load @rnmapbox/maps — require() throws before catch runs. */
export function isExpoGo(): boolean {
  return Constants.appOwnership === 'expo' || Constants.executionEnvironment === 'storeClient';
}

function mayUseNativeMapbox(): boolean {
  if (isExpoGo()) return false;
  return true;
}

/** Load native Mapbox module only in dev/production builds (never in Expo Go). */
export function getMapboxModule(): MapboxModule | null {
  if (mapboxModule !== undefined) return mapboxModule;
  if (!mayUseNativeMapbox()) {
    mapboxModule = null;
    return null;
  }
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require('@rnmapbox/maps') as unknown;
    const resolved = (mod as { default?: MapboxModule })?.default ?? mod;
    mapboxModule = resolved as MapboxModule;
  } catch {
    mapboxModule = null;
  }
  return mapboxModule;
}

export function isMapboxNativeAvailable(): boolean {
  if (!canUseMapbox() || !mayUseNativeMapbox()) return false;
  return getMapboxModule() != null;
}

/** Mapbox token present but use react-native-maps + raster tiles (Expo Go / missing native). */
export function shouldUseLegacyMapEngine(): boolean {
  return canUseMapbox() && !isMapboxNativeAvailable();
}

/** @deprecated Use resolveMapEngine() from utils/map-engine.ts */
export function shouldUseMapboxGlEngine(): boolean {
  return isMapboxNativeAvailable();
}
