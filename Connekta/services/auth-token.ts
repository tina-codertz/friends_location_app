/**
 * In-memory auth token for API requests (kept in sync with AuthContext).
 * Avoids race where SecureStore lags behind React state after login.
 */

let memoryToken: string | null = null;
let onUnauthorized: (() => void) | null = null;

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
