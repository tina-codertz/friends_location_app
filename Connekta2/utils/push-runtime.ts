import Constants from 'expo-constants';

export type NotificationsModule = typeof import('expo-notifications');

let cachedModule: NotificationsModule | null | undefined;

/** Remote/local push APIs are not supported in Expo Go (SDK 53+). */
export function isPushRuntimeAvailable(): boolean {
  return Constants.appOwnership !== 'expo';
}

export async function getNotificationsModule(): Promise<NotificationsModule | null> {
  if (cachedModule !== undefined) return cachedModule;
  if (!isPushRuntimeAvailable()) {
    cachedModule = null;
    return null;
  }
  try {
    cachedModule = await import('expo-notifications');
    return cachedModule;
  } catch (err) {
    console.warn('[push] expo-notifications unavailable:', err);
    cachedModule = null;
    return null;
  }
}
