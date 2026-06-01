import * as SecureStore from 'expo-secure-store';

/** Session ends after this much time without the app being used. */
export const SESSION_TIMEOUT_MS = 10 * 60 * 1000;

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

export async function isSessionExpired(): Promise<boolean> {
  const last = await getLastSessionActivity();
  if (last == null) return false;
  return Date.now() - last >= SESSION_TIMEOUT_MS;
}

export async function sessionInactiveMs(): Promise<number> {
  const last = await getLastSessionActivity();
  if (last == null) return 0;
  return Date.now() - last;
}
