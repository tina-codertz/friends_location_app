import Constants from 'expo-constants';

/** Normalize env/extra values (may be null, boolean, or non-string in dev). */
export function normalizeMapsApiKey(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function getMapboxAccessToken(): string | null {
  const fromEnv = normalizeMapsApiKey(process.env.EXPO_PUBLIC_MAPBOX_TOKEN);
  if (fromEnv) return fromEnv;

  const extra = Constants.expoConfig?.extra as { mapboxAccessToken?: unknown } | undefined;
  return normalizeMapsApiKey(extra?.mapboxAccessToken);
}

export function canUseMapbox(): boolean {
  return getMapboxAccessToken() != null;
}

/** @deprecated Google Maps — optional fallback; Mapbox is primary. */
export function getAndroidMapsApiKey(): string | null {
  const fromEnv = normalizeMapsApiKey(process.env.EXPO_PUBLIC_GOOGLE_MAPS_ANDROID_API_KEY);
  if (fromEnv) return fromEnv;

  const extra = Constants.expoConfig?.extra as { googleMapsAndroidApiKey?: unknown } | undefined;
  return normalizeMapsApiKey(extra?.googleMapsAndroidApiKey);
}

export function canUseNativeMapsOnAndroid(): boolean {
  return canUseMapbox() || getAndroidMapsApiKey() != null;
}

/** Dark style — matches app #121212 theme */
export const MAPBOX_STYLE_URL = 'mapbox://styles/mapbox/dark-v11';
