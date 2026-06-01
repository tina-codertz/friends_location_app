/**
 * In-memory auth token for API requests (kept in sync with AuthContext).
 * Avoids race where SecureStore lags behind React state after login.
 */

let memoryToken: string | null = null;
let onUnauthorized: (() => void) | null = null;
/** When true, 401 from the Cloudflare API must not clear Firebase session. */
let legacyApiLogoutOn401 = false;

export function setLegacyApiLogoutOn401(enabled: boolean) {
  legacyApiLogoutOn401 = enabled;
}

export function getLegacyApiLogoutOn401(): boolean {
  return legacyApiLogoutOn401;
}

export function setApiAuthToken(token: string | null) {
  memoryToken = token;
}

export function getApiAuthToken(): string | null {
  return memoryToken;
}

export function setApiUnauthorizedHandler(handler: (() => void) | null) {
  onUnauthorized = handler;
}

export function notifyUnauthorized() {
  onUnauthorized?.();
}
