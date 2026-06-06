import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';

export const BIO_NEEDS_ENROLL_KEY = 'needs_biometric_enrollment';
export const BIO_HAS_CREDS_KEY = 'biometric_has_credentials';
const BIO_CREDS_KEY = 'biometric_credentials';
const BIO_PENDING_CREDS_KEY = 'biometric_pending_credentials';
export const BIO_LAST_EMAIL_KEY = 'biometric_last_email';

type StoredCredentials = { email: string; password: string };

export type BiometricPolicy = {
  /** True when secure credentials are saved for sign-in after session timeout. */
  hasStoredCredentials: boolean;
  needsEnrollment: boolean;
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
  const [needs, hasCreds, lastEmail] = await Promise.all([
    SecureStore.getItemAsync(BIO_NEEDS_ENROLL_KEY),
    SecureStore.getItemAsync(BIO_HAS_CREDS_KEY),
    SecureStore.getItemAsync(BIO_LAST_EMAIL_KEY),
  ]);
  return {
    hasStoredCredentials: hasCreds === '1',
    needsEnrollment: needs === '1',
    lastEmail: lastEmail ?? null,
  };
}

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

/** Save credentials for sign-in after the 10-minute inactivity timeout. */
export async function enableBiometricUnlock(
  email: string,
  password: string,
  promptMessage = 'Enable biometric sign-in'
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
      authenticationPrompt: 'Sign in to Connekta',
    });
    await SecureStore.setItemAsync(BIO_HAS_CREDS_KEY, '1');
    await SecureStore.setItemAsync(BIO_LAST_EMAIL_KEY, payload.email);
    await SecureStore.deleteItemAsync(BIO_NEEDS_ENROLL_KEY);
    await clearPendingBiometricCredentials();
    return { ok: true };
  } catch {
    return { ok: false, reason: 'error' };
  }
}

export async function promptBiometricUnlock(
  message = 'Sign in to Connekta'
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

export async function disableBiometricUnlock(): Promise<void> {
  await Promise.all([
    SecureStore.deleteItemAsync(BIO_NEEDS_ENROLL_KEY),
    SecureStore.deleteItemAsync(BIO_HAS_CREDS_KEY),
    SecureStore.deleteItemAsync(BIO_CREDS_KEY),
    SecureStore.deleteItemAsync(BIO_PENDING_CREDS_KEY),
    SecureStore.deleteItemAsync(BIO_LAST_EMAIL_KEY),
  ].map((p) => p.catch(() => undefined)));
}

export async function scheduleBiometricEnrollmentIfNeeded(
  email: string,
  password: string
): Promise<void> {
  const policy = await getBiometricPolicy();
  if (policy.needsEnrollment || policy.hasStoredCredentials) return;
  if (!(await deviceSupportsBiometric())) return;

  await storePendingBiometricCredentials(email, password);
  await SecureStore.setItemAsync(BIO_NEEDS_ENROLL_KEY, '1');
}

export async function skipBiometricEnrollment(): Promise<void> {
  await clearPendingBiometricCredentials();
  await SecureStore.deleteItemAsync(BIO_NEEDS_ENROLL_KEY).catch(() => undefined);
}
