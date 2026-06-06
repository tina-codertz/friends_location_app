import { Platform } from 'react-native';
import Constants from 'expo-constants';

export type MapProviderPreference = 'mapbox' | 'google';

/** Normalize env/extra values (may be null, boolean, or non-string in dev). */
export function normalizeMapsApiKey(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function getExpoExtra(): Record<string, unknown> | undefined {
  const fromExpoConfig = Constants.expoConfig?.extra;
  if (fromExpoConfig && typeof fromExpoConfig === 'object') {
    return fromExpoConfig as Record<string, unknown>;
  }

  const manifest2 = (Constants as { manifest2?: { extra?: unknown } }).manifest2?.extra;
  if (manifest2 && typeof manifest2 === 'object') {
    return manifest2 as Record<string, unknown>;
  }

  const manifest = Constants.manifest as { extra?: unknown } | null;
  if (manifest?.extra && typeof manifest.extra === 'object') {
    return manifest.extra as Record<string, unknown>;
  }

  return undefined;
}

export function getMapboxAccessToken(): string | null {
  const extra = getExpoExtra();
  const fromExtra = normalizeMapsApiKey(extra?.mapboxAccessToken);
  if (fromExtra) return fromExtra;

  const fromEnv = normalizeMapsApiKey(process.env.EXPO_PUBLIC_MAPBOX_TOKEN);
  if (fromEnv) return fromEnv;

  return null;
}

export function canUseMapbox(): boolean {
  return getMapboxAccessToken() != null;
}

/** Shared Google Maps API key (Maps SDK for iOS/Android). */
export function getGoogleMapsApiKey(): string | null {
  const shared = normalizeMapsApiKey(process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY);
  if (shared) return shared;

  const extra = getExpoExtra();
  const fromExtra =
    normalizeMapsApiKey(extra?.googleMapsApiKey) ??
    normalizeMapsApiKey(extra?.googleMapsAndroidApiKey);
  if (fromExtra) return fromExtra;

  return null;
}

export function getGoogleMapsIosApiKey(): string | null {
  const ios = normalizeMapsApiKey(process.env.EXPO_PUBLIC_GOOGLE_MAPS_IOS_API_KEY);
  if (ios) return ios;
  return getGoogleMapsApiKey();
}

/** Android Maps SDK key (react-native-maps PROVIDER_GOOGLE). */
export function getAndroidMapsApiKey(): string | null {
  const android = normalizeMapsApiKey(process.env.EXPO_PUBLIC_GOOGLE_MAPS_ANDROID_API_KEY);
  if (android) return android;
  return getGoogleMapsApiKey();
}

export function canUseGoogleMapsOnPlatform(): boolean {
  if (Platform.OS === 'ios') return getGoogleMapsIosApiKey() != null;
  if (Platform.OS === 'android') return getAndroidMapsApiKey() != null;
  return false;
}

/** `EXPO_PUBLIC_MAP_PROVIDER=google` or extra.mapProvider from app.config (EAS builds). */
export function getMapProviderPreference(): MapProviderPreference {
  const extra = getExpoExtra();
  const fromExtra =
    typeof extra?.mapProvider === 'string' ? extra.mapProvider.trim().toLowerCase() : null;
  const raw = (process.env.EXPO_PUBLIC_MAP_PROVIDER ?? fromExtra)?.trim().toLowerCase();
  if (raw === 'google') return 'google';
  return 'mapbox';
}

export function prefersGoogleMaps(): boolean {
  return getMapProviderPreference() === 'google' && canUseGoogleMapsOnPlatform();
}

export type MapColorMode = 'light' | 'dark';

/** Zoom limits for ConnektaMap camera (navigation-focused, readable scale). */
export const MAP_ZOOM = {
  min: 4,
  max: 18,
  /** Slightly closer default — easier to read street names. */
  defaultLatitudeDelta: 0.028,
} as const;

export function latitudeDeltaToZoom(latitudeDelta?: number): number {
  const delta = latitudeDelta ?? MAP_ZOOM.defaultLatitudeDelta;
  const raw = Math.log2(360 / delta) - 1;
  return Math.max(MAP_ZOOM.min, Math.min(MAP_ZOOM.max, raw));
}

/**
 * Mapbox Standard — detailed POIs and street labels (readable in new areas).
 * Avoid navigation-night; it hides labels for turn-by-turn driving.
 */
export function getMapboxStyleUrl(mode: MapColorMode): string {
  return 'mapbox://styles/mapbox/standard';
}

/** Raster fallback (Expo Go) — streets / dark with full label detail. */
export function getMapboxRasterStyleId(mode: MapColorMode): string {
  return mode === 'dark' ? 'dark-v11' : 'streets-v12';
}

