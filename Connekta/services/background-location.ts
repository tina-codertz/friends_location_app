import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { onAuthStateChanged } from '@firebase/auth';
import { auth } from '@/connekta-firebase';
import { getMyLocationState, pingLocation, setLocationSharing } from '@/connekta-firebase/firestore/location';

export const BACKGROUND_LOCATION_TASK = 'connekta-background-location';

const ACTIVE_UID_KEY = 'connekta.backgroundLocation.uid';
const SHARE_UNTIL_KEY = 'connekta.backgroundLocation.shareUntil';

/** Balanced background intervals — map tab watch supplements while open. */
const BACKGROUND_UPDATE_OPTIONS: Location.LocationTaskOptions = {
  accuracy: Location.Accuracy.Balanced,
  activityType: Location.ActivityType.OtherNavigation,
  distanceInterval: 30,
  timeInterval: 30_000,
  deferredUpdatesDistance: 75,
  deferredUpdatesInterval: 90_000,
  pausesUpdatesAutomatically: true,
  showsBackgroundLocationIndicator: true,
  foregroundService: {
    notificationTitle: 'Connekta live location',
    notificationBody: 'Sharing your live location with your circle.',
    notificationColor: '#38BDF8',
  },
};

export type LocationPermissionStatus = {
  foreground: Location.PermissionStatus;
  background: Location.PermissionStatus | null;
  backgroundAvailable: boolean;
};

export type StartBackgroundResult = {
  success: boolean;
  message?: string;
  shareUntilIso?: string | null;
};

function shareUntilFromMinutes(durationMinutes?: number | null): string | null {
  if (!durationMinutes || durationMinutes <= 0) return null;
  return new Date(Date.now() + durationMinutes * 60 * 1000).toISOString();
}

function isExpired(shareUntilIso: string | null): boolean {
  return !!shareUntilIso && Date.parse(shareUntilIso) <= Date.now();
}

async function stopNativeTaskIfRegistered(): Promise<void> {
  const registered = await Location.hasStartedLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
  if (registered) {
    await Location.stopLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
  }
}

async function currentUid(): Promise<string | null> {
  if (auth.currentUser?.uid) return auth.currentUser.uid;

  return await new Promise((resolve) => {
    const timeout = setTimeout(() => {
      unsub();
      resolve(null);
    }, 2500);
    const unsub = onAuthStateChanged(auth, (user) => {
      clearTimeout(timeout);
      unsub();
      resolve(user?.uid ?? null);
    });
  });
}

async function clearBackgroundLocationState(): Promise<void> {
  await AsyncStorage.multiRemove([ACTIVE_UID_KEY, SHARE_UNTIL_KEY]);
}

async function ensureLocationUpdatesRunning(): Promise<void> {
  const registered = await Location.hasStartedLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
  if (!registered) {
    await Location.startLocationUpdatesAsync(BACKGROUND_LOCATION_TASK, BACKGROUND_UPDATE_OPTIONS);
  }
}

export async function getLocationPermissionStatus(): Promise<LocationPermissionStatus> {
  const foreground = await Location.getForegroundPermissionsAsync();
  const backgroundAvailable = await Location.isBackgroundLocationAvailableAsync();
  const background = backgroundAvailable
    ? await Location.getBackgroundPermissionsAsync()
    : null;
  return {
    foreground: foreground.status,
    background: background?.status ?? null,
    backgroundAvailable,
  };
}

async function persistSharingSession(uid: string, shareUntilIso: string | null): Promise<void> {
  await AsyncStorage.multiSet([
    [ACTIVE_UID_KEY, uid],
    [SHARE_UNTIL_KEY, shareUntilIso ?? ''],
  ]);
}

async function handleBackgroundLocations(locations: Location.LocationObject[]): Promise<void> {
  if (locations.length === 0) return;

  const [storedUid, shareUntilIso] = await AsyncStorage.multiGet([ACTIVE_UID_KEY, SHARE_UNTIL_KEY]).then(
    (pairs) => [pairs[0]?.[1] ?? null, pairs[1]?.[1] ?? null] as const,
  );
  if (!storedUid) {
    await stopNativeTaskIfRegistered();
    return;
  }

  const uid = await currentUid();
  if (!uid || uid !== storedUid) return;

  if (isExpired(shareUntilIso)) {
    await setLocationSharing(uid, false, null).catch(() => undefined);
    await clearBackgroundLocationState();
    await stopNativeTaskIfRegistered();
    return;
  }

  const latest = locations[locations.length - 1];
  await pingLocation(uid, latest.coords.latitude, latest.coords.longitude, {
    accuracy: latest.coords.accuracy,
    source: 'background',
  }).catch(() => undefined);
}

TaskManager.defineTask(BACKGROUND_LOCATION_TASK, async ({ data, error }) => {
  if (error) {
    console.warn('[background-location] task error:', error);
    return;
  }
  const payload = data as { locations?: Location.LocationObject[] } | undefined;
  await handleBackgroundLocations(payload?.locations ?? []);
});

export async function startBackgroundLocationSharing(
  durationMinutes?: number | null,
): Promise<StartBackgroundResult> {
  const uid = auth.currentUser?.uid;
  if (!uid) return { success: false, message: 'Sign in before sharing location.' };

  const fg = await Location.requestForegroundPermissionsAsync();
  if (fg.status !== 'granted') {
    return { success: false, message: 'Foreground location permission is required.' };
  }

  const bgAvailable = await Location.isBackgroundLocationAvailableAsync();
  if (!bgAvailable) {
    return { success: false, message: 'Background location is not available on this device/build.' };
  }

  const bg = await Location.requestBackgroundPermissionsAsync();
  if (bg.status !== 'granted') {
    return {
      success: false,
      message: 'Allow "Always" location so sharing continues when the app is closed.',
    };
  }

  const shareUntilIso = shareUntilFromMinutes(durationMinutes);
  await setLocationSharing(uid, true, shareUntilIso);
  await persistSharingSession(uid, shareUntilIso);

  const current = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
  await pingLocation(uid, current.coords.latitude, current.coords.longitude, {
    accuracy: current.coords.accuracy,
    source: 'manual',
  });

  await ensureLocationUpdatesRunning();

  return { success: true, shareUntilIso };
}

export async function stopBackgroundLocationSharing(): Promise<void> {
  const uid = auth.currentUser?.uid;
  await stopNativeTaskIfRegistered().catch(() => undefined);
  await clearBackgroundLocationState();
  if (uid) {
    await setLocationSharing(uid, false, null).catch(() => undefined);
  }
}

/**
 * Reconcile local task state with Firestore after login, app launch, or foreground return.
 * Restarts the background task if sharing is active but the OS stopped it.
 */
export async function syncBackgroundLocationSharing(): Promise<void> {
  const uid = await currentUid();
  if (!uid) {
    await stopNativeTaskIfRegistered().catch(() => undefined);
    await clearBackgroundLocationState();
    return;
  }

  let remoteSharing = false;
  let shareUntilIso: string | null = null;
  try {
    const state = await getMyLocationState(uid);
    remoteSharing = state.sharing;
    shareUntilIso = state.share_until;
  } catch {
    const [storedUid, storedUntil] = await AsyncStorage.multiGet([ACTIVE_UID_KEY, SHARE_UNTIL_KEY]).then(
      (pairs) => [pairs[0]?.[1] ?? null, pairs[1]?.[1] ?? null] as const,
    );
    if (storedUid !== uid) return;
    remoteSharing = true;
    shareUntilIso = storedUntil || null;
  }

  if (!remoteSharing || isExpired(shareUntilIso)) {
    if (remoteSharing && isExpired(shareUntilIso)) {
      await stopBackgroundLocationSharing();
    } else {
      await stopNativeTaskIfRegistered().catch(() => undefined);
      await clearBackgroundLocationState();
    }
    return;
  }

  await persistSharingSession(uid, shareUntilIso);

  const perms = await getLocationPermissionStatus();
  if (perms.background !== 'granted') return;

  try {
    await ensureLocationUpdatesRunning();
  } catch (err) {
    console.warn('[background-location] resume failed:', err);
  }
}
