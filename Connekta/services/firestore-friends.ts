import { collection, getDocs, query, where } from 'firebase/firestore';
import { auth, firestore } from '@/lib/firebase';

const MIN_TOKEN_CHECK_MS = 60_000;
const QUOTA_BACKOFF_MS = 15 * 60_000;

let lastTokenUid: string | null = null;
let lastTokenCheckAt = 0;
let quotaBackoffUntil = 0;

export function isAuthQuotaExceeded(err: unknown): boolean {
  const code =
    err && typeof err === 'object' && 'code' in err
      ? String((err as { code: string }).code)
      : '';
  if (code === 'auth/quota-exceeded') return true;
  return String(err).includes('auth/quota-exceeded');
}

/** Clears backoff after a successful sign-in (call from AuthContext). */
export function clearAuthQuotaBackoff(): void {
  quotaBackoffUntil = 0;
}

/**
 * Verifies the signed-in user matches `uid`. Uses cached ID tokens by default —
 * do not force refresh on every Firestore read (causes auth/quota-exceeded).
 */
export async function ensureFirestoreSignedIn(
  uid: string,
  options?: { force?: boolean },
): Promise<void> {
  if (Date.now() < quotaBackoffUntil) {
    throw new Error(
      'Firebase sign-in quota reached. Wait a few minutes, then reload the app.',
    );
  }

  const current = auth.currentUser;
  if (!current || current.uid !== uid) {
    throw new Error('You must be signed in.');
  }

  const now = Date.now();
  const force = options?.force === true;
  if (
    !force &&
    lastTokenUid === uid &&
    now - lastTokenCheckAt < MIN_TOKEN_CHECK_MS
  ) {
    return;
  }

  try {
    await current.getIdToken(force);
    lastTokenUid = uid;
    lastTokenCheckAt = now;
  } catch (err) {
    if (isAuthQuotaExceeded(err)) {
      quotaBackoffUntil = now + QUOTA_BACKOFF_MS;
    }
    throw err;
  }
}

/** Current user + all friend uids in the circle. */
export async function getCircleMemberUids(uid: string): Promise<string[]> {
  const snap = await getDocs(
    query(collection(firestore, 'friendships'), where('memberIds', 'array-contains', uid)),
  );
  const set = new Set<string>([uid]);
  snap.docs.forEach((d) => {
    const members = d.data().memberIds as string[] | undefined;
    members?.forEach((m) => set.add(m));
  });
  return [...set];
}
