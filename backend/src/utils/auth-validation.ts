/** Trim and validate username (letters, numbers, underscore; 2–32 chars). */
export function normalizeUsername(username: string): { ok: true; value: string } | { ok: false; message: string } {
  const value = username.trim();
  if (value.length < 2 || value.length > 32) {
    return { ok: false, message: 'Username must be 2–32 characters' };
  }
  if (!/^[a-zA-Z0-9_]+$/.test(value)) {
    return { ok: false, message: 'Username can only contain letters, numbers, and underscores' };
  }
  return { ok: true, value };
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}
