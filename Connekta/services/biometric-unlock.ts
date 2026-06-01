import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';

export const BIO_ENABLED_KEY = 'biometric_unlock_enabled';
export const BIO_NEEDS_ENROLL_KEY = 'needs_biometric_enrollment';
export const BIO_HAS_CREDS_KEY = 'biometric_has_credentials';
const BIO_CREDS_KEY = 'biometric_credentials';
const BIO_PENDING_CREDS_KEY = 'biometric_pending_credentials';
export const BIO_LAST_EMAIL_KEY = 'biometric_last_email';

type StoredCredentials = { email: string; password: string };

export type BiometricPolicy = {
  enabled: boolean;
  needsEnrollment: boolean;
  hasStoredCredentials: boolean;
  lastEmail: string | null;
};

export async function deviceSupportsBiometric(): Promise<boolean> {
  try {
    const has = await LocalAuthentication.hasHardwareAsync();
    const enrolled = await LocalAuthentication.isEnrolledAsync();
    return has && enrolled;
  } catch {
    return false;
  }
}

export async function getBiometricPolicy(): Promise<BiometricPolicy> {
  const [enabled, needs, hasCreds, lastEmail] = await Promise.all([
    SecureStore.getItemAsync(BIO_ENABLED_KEY),
    SecureStore.getItemAsync(BIO_NEEDS_ENROLL_KEY),
    SecureStore.getItemAsync(BIO_HAS_CREDS_KEY),
    SecureStore.getItemAsync(BIO_LAST_EMAIL_KEY),
  ]);
  return {
    enabled: enabled === '1',
    needsEnrollment: needs === '1',
    hasStoredCredentials: hasCreds === '1',
    lastEmail: lastEmail ?? null,
  };
}

/** Hold email/password until user completes enrollment (or skips). */
export async function storePendingBiometricCredentials(
  email: string,
  password: string
): Promise<void> {
  const payload: StoredCredentials = {
    email: email.trim().toLowerCase(),
    password,
  };
  await SecureStore.setItemAsync(BIO_PENDING_CREDS_KEY, JSON.stringify(payload));
  await SecureStore.setItemAsync(BIO_LAST_EMAIL_KEY, payload.email);
}

export async function consumePendingBiometricCredentials(): Promise<StoredCredentials | null> {
  try {
    const raw = await SecureStore.getItemAsync(BIO_PENDING_CREDS_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as StoredCredentials;
  } catch {
    return null;
  }
}

export async function clearPendingBiometricCredentials(): Promise<void> {
  await SecureStore.deleteItemAsync(BIO_PENDING_CREDS_KEY).catch(() => undefined);
}

/**
 * Enable biometric app lock + secure sign-in credentials (Face ID / fingerprint required to read).
 */
export async function enableBiometricUnlock(
  email: string,
  password: string,
  promptMessage = 'Enable biometric unlock'
): Promise<{ ok: true } | { ok: false; reason: 'unavailable' | 'cancelled' | 'error' }> {
  if (!(await deviceSupportsBiometric())) {
    return { ok: false, reason: 'unavailable' };
  }

  const auth = await LocalAuthentication.authenticateAsync({
    promptMessage,
    cancelLabel: 'Cancel',
    fallbackLabel: 'Use passcode',
  });
  if (!auth.success) {
    return { ok: false, reason: 'cancelled' };
  }

  const payload: StoredCredentials = {
    email: email.trim().toLowerCase(),
    password,
  };

  try {
    await SecureStore.setItemAsync(BIO_CREDS_KEY, JSON.stringify(payload), {
      requireAuthentication: true,
      authenticationPrompt: 'Unlock Connekta',
    });
    await SecureStore.setItemAsync(BIO_HAS_CREDS_KEY, '1');
    await SecureStore.setItemAsync(BIO_ENABLED_KEY, '1');
    await SecureStore.setItemAsync(BIO_LAST_EMAIL_KEY, payload.email);
    await SecureStore.deleteItemAsync(BIO_NEEDS_ENROLL_KEY);
    await clearPendingBiometricCredentials();
    return { ok: true };
  } catch {
    return { ok: false, reason: 'error' };
  }
}

/** App lock only (no quick sign-in after logout). */
export async function enableBiometricAppLockOnly(): Promise<void> {
  await SecureStore.setItemAsync(BIO_ENABLED_KEY, '1');
  await SecureStore.deleteItemAsync(BIO_NEEDS_ENROLL_KEY);
  await clearPendingBiometricCredentials();
}

export async function promptBiometricUnlock(
  message = 'Unlock Connekta'
): Promise<boolean> {
  if (!(await deviceSupportsBiometric())) {
    return true;
  }
  const result = await LocalAuthentication.authenticateAsync({
    promptMessage: message,
    cancelLabel: 'Cancel',
    fallbackLabel: 'Use passcode',
  });
  return result.success;
}

/** Sign-in from auth screen — biometric gate then returns stored credentials. */
export async function readBiometricCredentialsForSignIn(): Promise<StoredCredentials | null> {
  const has = await SecureStore.getItemAsync(BIO_HAS_CREDS_KEY);
  if (has !== '1') return null;

  try {
    const raw = await SecureStore.getItemAsync(BIO_CREDS_KEY, {
      requireAuthentication: true,
      authenticationPrompt: 'Sign in to Connekta',
    });
    if (!raw) return null;
    return JSON.parse(raw) as StoredCredentials;
  } catch {
    return null;
  }
}

/** Turn off app lock only; keeps credentials for quick sign-in on the auth screen. */
export async function disableBiometricAppLock(): Promise<void> {
  await SecureStore.deleteItemAsync(BIO_ENABLED_KEY).catch(() => undefined);
}

/** Full reset — sign out. */
export async function disableBiometricUnlock(): Promise<void> {
  await Promise.all([
    SecureStore.deleteItemAsync(BIO_ENABLED_KEY),
    SecureStore.deleteItemAsync(BIO_NEEDS_ENROLL_KEY),
    SecureStore.deleteItemAsync(BIO_HAS_CREDS_KEY),
    SecureStore.deleteItemAsync(BIO_CREDS_KEY),
    SecureStore.deleteItemAsync(BIO_PENDING_CREDS_KEY),
    SecureStore.deleteItemAsync(BIO_LAST_EMAIL_KEY),
  ].map((p) => p.catch(() => undefined)));
}

/** After password login/register — offer enrollment when device supports biometrics. */
export async function scheduleBiometricEnrollmentIfNeeded(
  email: string,
  password: string
): Promise<void> {
  const policy = await getBiometricPolicy();
  if (policy.enabled || policy.needsEnrollment || policy.hasStoredCredentials) return;
  if (!(await deviceSupportsBiometric())) return;

  await storePendingBiometricCredentials(email, password);
  await SecureStore.setItemAsync(BIO_NEEDS_ENROLL_KEY, '1');
}

export async function skipBiometricEnrollment(): Promise<void> {
  await clearPendingBiometricCredentials();
  await SecureStore.deleteItemAsync(BIO_NEEDS_ENROLL_KEY).catch(() => undefined);
}

/** Re-enable app lock when credentials are already stored (e.g. Settings toggle). */
export async function enableBiometricLockFromStoredCredentials(): Promise<
  { ok: true } | { ok: false; reason: 'no_credentials' | 'cancelled' }
> {
  const has = await SecureStore.getItemAsync(BIO_HAS_CREDS_KEY);
  if (has !== '1') {
    return { ok: false, reason: 'no_credentials' };
  }
  const ok = await promptBiometricUnlock('Enable biometric lock');
  if (!ok) return { ok: false, reason: 'cancelled' };
  await SecureStore.setItemAsync(BIO_ENABLED_KEY, '1');
  return { ok: true };
}
