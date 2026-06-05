/**
 * Shared live-location sharing API used by Map and Share Location screens.
 * Background GPS task is the primary pipeline; Map tab watch is supplemental.
 */

import { Alert, Linking, Platform } from 'react-native';
import {
  getLocationPermissionStatus,
  startBackgroundLocationSharing,
  stopBackgroundLocationSharing,
  type LocationPermissionStatus,
  type StartBackgroundResult,
} from '@/services/background-location';

export const DEFAULT_MAP_SHARE_DURATION_MINUTES = 60;

export type { LocationPermissionStatus, StartBackgroundResult };

export { getLocationPermissionStatus, stopBackgroundLocationSharing };

export async function startLiveLocationSharing(
  durationMinutes?: number | null,
): Promise<StartBackgroundResult> {
  return startBackgroundLocationSharing(durationMinutes);
}

export function permissionStatusLabel(status: LocationPermissionStatus): string {
  if (status.foreground !== 'granted') return 'Location off';
  if (status.background === 'granted') return 'Always allowed';
  if (status.backgroundAvailable) return 'While using app only';
  return 'Foreground only (background unavailable)';
}

export function permissionStatusHint(status: LocationPermissionStatus): string {
  if (status.foreground !== 'granted') {
    return 'Turn on location in system settings to share with your circle.';
  }
  if (status.background === 'granted') {
    return 'Your circle can see you even when Connekta is closed.';
  }
  if (status.backgroundAvailable) {
    return 'Choose "Always" in settings so sharing continues after you leave the app.';
  }
  return 'Use a development or production build for background sharing.';
}

export function showBackgroundPermissionRequiredAlert(status: LocationPermissionStatus): void {
  const needsSettings = status.foreground === 'granted' && status.background !== 'granted';

  Alert.alert(
    'Always-on location needed',
    needsSettings
      ? 'Live sharing needs "Always" location access. Open Settings, tap Location, and choose Always.'
      : permissionStatusHint(status),
    needsSettings
      ? [
          { text: 'Not now', style: 'cancel' },
          { text: 'Open Settings', onPress: () => void Linking.openSettings() },
        ]
      : [{ text: 'OK' }],
  );
}

export function showSharingStartFailureAlert(message?: string, status?: LocationPermissionStatus): void {
  const isPermission =
    message?.toLowerCase().includes('background') ||
    message?.toLowerCase().includes('permission') ||
    message?.toLowerCase().includes('always');

  if (isPermission && status) {
    showBackgroundPermissionRequiredAlert(status);
    return;
  }

  Alert.alert(
    'Could not start sharing',
    message ?? 'Check location permissions and try again.',
    Platform.OS === 'ios'
      ? [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Settings', onPress: () => void Linking.openSettings() },
        ]
      : [{ text: 'OK' }],
  );
}
