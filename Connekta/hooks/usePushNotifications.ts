import { useCallback, useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { saveDevicePushToken, removeDevicePushToken } from '@/connekta-firebase/firestore/devices';
import {
  configureNotificationHandler,
  parseNotificationPayload,
  registerForPushNotificationsAsync,
  routeForNotificationPayload,
} from '@/services/push-notifications';

async function resolveDeviceId(): Promise<string> {
  try {
    const fromSecure = await SecureStore.getItemAsync('device_id');
    if (fromSecure) return fromSecure;
    const fromAsync = await AsyncStorage.getItem('device_id');
    if (fromAsync) return fromAsync;
  } catch {
    /* ignore */
  }
  return `device-${Date.now()}`;
}

/** Registers Expo push token and handles notification tap navigation. */
export function usePushNotifications(active: boolean, uid: string | null | undefined) {
  const router = useRouter();
  const lastRegisteredRef = useRef<string | null>(null);

  const registerToken = useCallback(async () => {
    if (!active || !uid) return;

    const result = await registerForPushNotificationsAsync();
    if (!result.token || result.token === lastRegisteredRef.current) return;

    const deviceId = await resolveDeviceId();
    await saveDevicePushToken(uid, deviceId, result.token, result.platform);
    lastRegisteredRef.current = result.token;
  }, [active, uid]);

  useEffect(() => {
    configureNotificationHandler();
  }, []);

  useEffect(() => {
    if (!active || !uid) {
      lastRegisteredRef.current = null;
      return;
    }
    void registerToken();
  }, [active, uid, registerToken]);

  useEffect(() => {
    if (!active) return;

    const navigateFromResponse = (response: Notifications.NotificationResponse | null) => {
      if (!response) return;
      const payload = parseNotificationPayload(
        response.notification.request.content.data as Record<string, unknown>,
      );
      const route = routeForNotificationPayload(payload);
      if (route) router.push(route as never);
    };

    const sub = Notifications.addNotificationResponseReceivedListener(navigateFromResponse);

    void Notifications.getLastNotificationResponseAsync().then((response) => {
      navigateFromResponse(response);
    });

    return () => sub.remove();
  }, [active, router]);

  return { refreshPushRegistration: registerToken };
}

export async function clearPushRegistration(uid: string): Promise<void> {
  const deviceId = await resolveDeviceId();
  await removeDevicePushToken(uid, deviceId);
}
