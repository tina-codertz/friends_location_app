/**
 * Single API for live-location sharing: permissions, user messaging, and start/stop.
 * Native background task lives in background-location.ts; screens should use this module only.
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

export type LiveSharingResult = StartBackgroundResult & {
  permissionStatus: LocationPermissionStatus;
  /** User dismissed a pre-flight permission prompt without starting. */
  cancelled?: boolean;
};

export type StartLiveSharingOptions = {
  durationMinutes?: number | null;
  /** When background is not granted, show the always-on explainer before the OS prompt. */
  explainAlways?: boolean;
  /** Present failure alerts automatically (default true). */
  showAlerts?: boolean;
};

export type SetLiveSharingOptions = StartLiveSharingOptions;

const MESSAGES = {
  foregroundTitle: 'Location required',
  foregroundBody: 'Connekta needs location access to share with your circle.',
  alwaysTitle: 'Allow always-on location',
  alwaysBody:
    'Choose "Always" when prompted so your circle can see you after you close the app. This is required for live sharing.',
  alwaysSettingsTitle: 'Always-on location needed',
  alwaysSettingsBody:
    'Live sharing needs "Always" location access. Open Settings, tap Location, and choose Always.',
  startFailureTitle: 'Could not start sharing',
  startFailureFallback: 'Check location permissions and try again.',
  stopFailureTitle: 'Could not stop sharing',
  stopFailureBody: 'Try again in a moment.',
  genericStartError: 'Could not start live sharing. Check location permissions and try again.',
  mapStartHint: 'Could not start sharing. Open Share Location to check permissions.',
  mapStopHint: 'Could not stop sharing. Try again.',
  notSignedIn: 'Sign in before sharing location.',
} as const;

/** @deprecated Use getSharingPermissionStatus — kept for existing imports. */
export { getLocationPermissionStatus };

export async function getSharingPermissionStatus(): Promise<LocationPermissionStatus> {
  return getLocationPermissionStatus();
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

export function needsAlwaysPermission(status: LocationPermissionStatus): boolean {
  return (
    status.foreground === 'granted' &&
    status.backgroundAvailable &&
    status.background !== 'granted'
  );
}

export function formatSharingSummary(sharing: boolean, shareUntilIso: string | null): string {
  if (!sharing) return 'Currently off';
  if (shareUntilIso) {
    return `Active until ${new Date(shareUntilIso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  }
  return 'Active until you turn it off';
}

export function openLocationSettings(): void {
  void Linking.openSettings();
}

function settingsAlertButtons(): Array<{ text: string; style?: 'cancel'; onPress?: () => void }> {
  return Platform.OS === 'ios'
    ? [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Open Settings', onPress: openLocationSettings },
      ]
    : [
        { text: 'Not now', style: 'cancel' },
        { text: 'Open Settings', onPress: openLocationSettings },
      ];
}

export function showForegroundPermissionRequiredAlert(): void {
  Alert.alert(MESSAGES.foregroundTitle, MESSAGES.foregroundBody, settingsAlertButtons());
}

export function showBackgroundPermissionRequiredAlert(status?: LocationPermissionStatus): void {
  const needsSettings = !status || needsAlwaysPermission(status);

  Alert.alert(
    MESSAGES.alwaysSettingsTitle,
    needsSettings ? MESSAGES.alwaysSettingsBody : permissionStatusHint(status!),
    needsSettings ? settingsAlertButtons() : [{ text: 'OK' }],
  );
}

export function confirmAlwaysPermissionPrompt(): Promise<boolean> {
  return new Promise((resolve) => {
    Alert.alert(MESSAGES.alwaysTitle, MESSAGES.alwaysBody, [
      { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
      { text: 'Continue', onPress: () => resolve(true) },
    ]);
  });
}

function isPermissionRelatedFailure(message?: string): boolean {
  const lower = message?.toLowerCase() ?? '';
  return (
    lower.includes('background') ||
    lower.includes('permission') ||
    lower.includes('always') ||
    lower.includes('sign in')
  );
}

export function showSharingStartFailureAlert(
  message?: string,
  status?: LocationPermissionStatus,
): void {
  if (isPermissionRelatedFailure(message) && status) {
    if (status.foreground !== 'granted') {
      showForegroundPermissionRequiredAlert();
      return;
    }
    showBackgroundPermissionRequiredAlert(status);
    return;
  }

  Alert.alert(
    MESSAGES.startFailureTitle,
    message ?? MESSAGES.startFailureFallback,
    Platform.OS === 'ios'
      ? [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Settings', onPress: openLocationSettings },
        ]
      : [{ text: 'OK' }],
  );
}

export function showSharingStopFailureAlert(): void {
  Alert.alert(MESSAGES.stopFailureTitle, MESSAGES.stopFailureBody, [{ text: 'OK' }]);
}

export function showSharingToggleFailureAlert(enabling: boolean): void {
  Alert.alert(
    'Live sharing',
    enabling ? MESSAGES.mapStartHint : MESSAGES.mapStopHint,
    [{ text: 'OK' }],
  );
}

async function ensurePreflightPermissions(
  options: StartLiveSharingOptions,
): Promise<{ ok: boolean; status: LocationPermissionStatus; cancelled?: boolean }> {
  const status = await getSharingPermissionStatus();

  if (status.foreground !== 'granted') {
    if (options.showAlerts !== false) showForegroundPermissionRequiredAlert();
    return { ok: false, status, cancelled: true };
  }

  if (
    options.explainAlways &&
    needsAlwaysPermission(status)
  ) {
    const confirmed = await confirmAlwaysPermissionPrompt();
    if (!confirmed) return { ok: false, status, cancelled: true };
  }

  return { ok: true, status };
}

/**
 * Start live sharing with unified permission checks and error messaging.
 */
export async function startLiveSharing(
  options: StartLiveSharingOptions = {},
): Promise<LiveSharingResult> {
  const showAlerts = options.showAlerts !== false;
  const preflight = await ensurePreflightPermissions({ ...options, showAlerts });

  if (!preflight.ok) {
    return {
      success: false,
      permissionStatus: preflight.status,
      cancelled: preflight.cancelled,
      message: preflight.cancelled ? undefined : MESSAGES.startFailureFallback,
    };
  }

  const result = await startBackgroundLocationSharing(options.durationMinutes);
  const permissionStatus = await getSharingPermissionStatus();

  if (!result.success && showAlerts) {
    showSharingStartFailureAlert(result.message, permissionStatus);
  }

  return { ...result, permissionStatus };
}

/** @deprecated Use startLiveSharing — kept for existing call sites during migration. */
export async function startLiveLocationSharing(
  durationMinutes?: number | null,
): Promise<StartBackgroundResult> {
  const result = await startLiveSharing({ durationMinutes, explainAlways: false, showAlerts: false });
  return {
    success: result.success,
    message: result.message,
    shareUntilIso: result.shareUntilIso,
  };
}

/**
 * Stop live sharing with unified error messaging.
 */
export async function stopLiveSharing(options?: { showAlerts?: boolean }): Promise<boolean> {
  try {
    await stopBackgroundLocationSharing();
    return true;
  } catch {
    if (options?.showAlerts !== false) showSharingStopFailureAlert();
    return false;
  }
}

export { stopBackgroundLocationSharing };

/**
 * Enable or disable live sharing — used by map toggle and other controls.
 */
export async function setLiveSharingEnabled(
  enabled: boolean,
  options: SetLiveSharingOptions = {},
): Promise<LiveSharingResult & { sharing: boolean }> {
  if (!enabled) {
    const stopped = await stopLiveSharing({ showAlerts: options.showAlerts });
    const permissionStatus = await getSharingPermissionStatus();
    return {
      success: stopped,
      sharing: false,
      permissionStatus,
      message: stopped ? undefined : MESSAGES.stopFailureBody,
    };
  }

  const result = await startLiveSharing({
    durationMinutes: options.durationMinutes ?? DEFAULT_MAP_SHARE_DURATION_MINUTES,
    explainAlways: options.explainAlways ?? true,
    showAlerts: options.showAlerts,
  });

  return {
    ...result,
    sharing: result.success,
  };
}
