import Constants from 'expo-constants';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import type { PushNotificationPayload } from '@/types/notifications';
import { getNotificationsModule, isPushRuntimeAvailable } from '@/utils/push-runtime';

const ANDROID_CHANNEL_ID = 'connekta-alerts';

export type PushPermissionStatus = 'granted' | 'denied' | 'undetermined';

export const NOTIFICATION_ROUTE_BY_TYPE: Record<string, string> = {
  friend_request: '/(tabs)/friends',
  friend_accepted: '/(tabs)/friends',
  sharing_expired: '/(tabs)/ShareLocation',
  sharing_paused: '/(tabs)/settings/LocationPrivacy',
  sos: '/(tabs)/SOSScreen',
  place_arrival: '/(tabs)/map',
  place_departure: '/(tabs)/map',
};

let handlerConfigured = false;

export async function configureNotificationHandler(): Promise<void> {
  if (handlerConfigured) return;
  const Notifications = await getNotificationsModule();
  if (!Notifications) return;
  handlerConfigured = true;

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

function resolveExpoProjectId(): string | null {
  const easProjectId = Constants.expoConfig?.extra?.eas?.projectId;
  if (typeof easProjectId === 'string' && easProjectId.trim()) return easProjectId.trim();

  const envProjectId = process.env.EXPO_PUBLIC_EAS_PROJECT_ID?.trim();
  return envProjectId || null;
}

async function ensureAndroidChannel(): Promise<void> {
  if (Platform.OS !== 'android') return;
  const Notifications = await getNotificationsModule();
  if (!Notifications) return;
  await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL_ID, {
    name: 'Connekta alerts',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#38BDF8',
  });
}

export async function getPushPermissionStatus(): Promise<PushPermissionStatus> {
  const Notifications = await getNotificationsModule();
  if (!Notifications) return 'undetermined';
  const settings = await Notifications.getPermissionsAsync();
  return settings.status;
}

export function pushUnavailableReason(): string | null {
  if (!isPushRuntimeAvailable()) {
    return 'Push notifications require a development or production build (not Expo Go).';
  }
  if (!Device.isDevice) {
    return 'Push requires a physical device.';
  }
  return null;
}

export async function registerForPushNotificationsAsync(): Promise<{
  token: string | null;
  platform: 'ios' | 'android' | 'unknown';
  reason?: string;
}> {
  const unavailable = pushUnavailableReason();
  if (unavailable) {
    return { token: null, platform: 'unknown', reason: unavailable };
  }

  const Notifications = await getNotificationsModule();
  if (!Notifications) {
    return { token: null, platform: 'unknown', reason: 'Notifications module unavailable.' };
  }

  await configureNotificationHandler();
  await ensureAndroidChannel();

  let settings = await Notifications.getPermissionsAsync();
  if (settings.status !== 'granted') {
    settings = await Notifications.requestPermissionsAsync({
      ios: { allowAlert: true, allowBadge: true, allowSound: true },
    });
  }

  if (settings.status !== 'granted') {
    return { token: null, platform: Platform.OS === 'ios' ? 'ios' : 'android', reason: 'Permission denied' };
  }

  const projectId = resolveExpoProjectId();
  if (!projectId) {
    return { token: null, platform: 'unknown', reason: 'Missing EAS projectId in app config.' };
  }

  try {
    const token = await Notifications.getExpoPushTokenAsync({ projectId });
    return {
      token: token.data,
      platform: Platform.OS === 'ios' ? 'ios' : Platform.OS === 'android' ? 'android' : 'unknown',
    };
  } catch (err) {
    console.warn('[push] token registration failed:', err);
    return {
      token: null,
      platform: Platform.OS === 'ios' ? 'ios' : 'android',
      reason: 'Could not get push token. Use a development build.',
    };
  }
}

export function parseNotificationPayload(
  data: Record<string, unknown> | undefined,
): PushNotificationPayload {
  if (!data) return {};
  return {
    type: typeof data.type === 'string' ? (data.type as PushNotificationPayload['type']) : undefined,
    route: typeof data.route === 'string' ? data.route : undefined,
    fromUid: typeof data.fromUid === 'string' ? data.fromUid : undefined,
  };
}

export function routeForNotificationPayload(payload: PushNotificationPayload): string | null {
  if (payload.route?.trim()) return payload.route.trim();
  if (payload.type && NOTIFICATION_ROUTE_BY_TYPE[payload.type]) {
    return NOTIFICATION_ROUTE_BY_TYPE[payload.type];
  }
  return null;
}

export async function showLocalNotification(
  title: string,
  body: string,
  data?: PushNotificationPayload,
): Promise<void> {
  const Notifications = await getNotificationsModule();
  if (!Notifications) return;

  await configureNotificationHandler();
  await ensureAndroidChannel();
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data: data ?? {},
      sound: true,
      ...(Platform.OS === 'android' ? { channelId: ANDROID_CHANNEL_ID } : {}),
    },
    trigger: null,
  });
}
