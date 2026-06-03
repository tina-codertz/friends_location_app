/** In-memory Firebase ID token (synced by AuthContext). */
let memoryToken: string | null = null;

export function setApiAuthToken(token: string | null) {
  memoryToken = token;
}

export function getApiAuthToken(): string | null {
  return memoryToken;
}
