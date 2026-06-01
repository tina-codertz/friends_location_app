import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  deleteUser,
  type User as FirebaseUser,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
  runTransaction,
} from 'firebase/firestore';
import { auth, firestore } from '@/app/lib/firebase';
import type { AppUser } from '@/types/user';

export function firebaseAuthErrorMessage(err: unknown): string {
  const code =
    err && typeof err === 'object' && 'code' in err
      ? String((err as { code: string }).code)
      : '';

  switch (code) {
    case 'auth/email-already-in-use':
      return 'This email is already registered.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/weak-password':
      return 'Password must be at least 6 characters.';
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Invalid email or password.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Try again later.';
    default:
      if (err instanceof Error && err.message) return err.message;
      return 'Something went wrong. Please try again.';
  }
}

export async function isUsernameAvailable(username: string): Promise<boolean> {
  const key = username.trim().toLowerCase();
  const snap = await getDoc(doc(firestore, 'usernames', key));
  return !snap.exists();
}

export async function registerWithEmail(
  email: string,
  password: string,
  username: string,
  deviceId: string,
): Promise<AppUser> {
  const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
  const uid = cred.user.uid;
  const usernameKey = username.trim().toLowerCase();

  try {
    await runTransaction(firestore, async (tx) => {
      const usernameRef = doc(firestore, 'usernames', usernameKey);
      const userRef = doc(firestore, 'users', uid);

      const existing = await tx.get(usernameRef);
      if (existing.exists()) {
        throw new Error('Username is already taken');
      }

      tx.set(usernameRef, { uid });
      tx.set(userRef, {
        email: email.trim().toLowerCase(),
        username: username.trim(),
        deviceId,
        createdAt: serverTimestamp(),
        sharing: false,
        lat: null,
        lng: null,
        locationUpdatedAt: null,
      });
    });
  } catch (err) {
    try {
      await deleteUser(cred.user);
    } catch {
      /* auth user may already be gone */
    }
    throw err;
  }

  return {
    uid,
    email: email.trim().toLowerCase(),
    username: username.trim(),
  };
}

export async function loginWithEmail(email: string, password: string): Promise<AppUser> {
  const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
  const profile = await loadAppUser(cred.user);
  if (!profile) {
    throw new Error('Profile not found. Please sign up again or contact support.');
  }
  return profile;
}

export async function loadAppUser(fbUser: FirebaseUser): Promise<AppUser | null> {
  const snap = await getDoc(doc(firestore, 'users', fbUser.uid));
  if (!snap.exists()) return null;
  const data = snap.data();
  return {
    uid: fbUser.uid,
    email: String(data.email ?? fbUser.email ?? ''),
    username: String(data.username ?? ''),
  };
}

export async function firebaseLogout(): Promise<void> {
  await signOut(auth);
}

export { onAuthStateChanged };
