import Constants from 'expo-constants';

/** Normalize env/extra values (may be null, boolean, or non-string in dev). */
export function normalizeMapsApiKey(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function getAndroidMapsApiKey(): string | null {
  const fromEnv = normalizeMapsApiKey(process.env.EXPO_PUBLIC_GOOGLE_MAPS_ANDROID_API_KEY);
  if (fromEnv) return fromEnv;

  const extra = Constants.expoConfig?.extra as { googleMapsAndroidApiKey?: unknown } | undefined;
  return normalizeMapsApiKey(extra?.googleMapsAndroidApiKey);
}

export function canUseNativeMapsOnAndroid(): boolean {
  return getAndroidMapsApiKey() != null;
}
