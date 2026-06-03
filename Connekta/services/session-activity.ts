import * as SecureStore from 'expo-secure-store';

/**
 * Inactivity timeout disabled — sessions persist on device until explicit sign-out
 * (Firebase Auth + AsyncStorage). Kept for legacy SecureStore cleanup on logout.
 */
export const SESSION_TIMEOUT_MS = Number.POSITIVE_INFINITY;

const LAST_ACTIVE_KEY = 'session_last_active_at';

export async function recordSessionActivity(): Promise<void> {
  await SecureStore.setItemAsync(LAST_ACTIVE_KEY, String(Date.now()));
}

export async function clearSessionActivity(): Promise<void> {
  await SecureStore.deleteItemAsync(LAST_ACTIVE_KEY).catch(() => undefined);
}

export async function getLastSessionActivity(): Promise<number | null> {
  const raw = await SecureStore.getItemAsync(LAST_ACTIVE_KEY);
  if (!raw) return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

/** Always false — app trusts the device until the user signs out. */
export async function isSessionExpired(): Promise<boolean> {
  return false;
}

export async function sessionInactiveMs(): Promise<number> {
  const last = await getLastSessionActivity();
  if (last == null) return 0;
  return Date.now() - last;
}
