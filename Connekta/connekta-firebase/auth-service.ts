import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  deleteUser,
  EmailAuthProvider,
  reauthenticateWithCredential,
  type User as FirebaseUser,
} from '@firebase/auth';
import {
  doc,
  getDoc,
  writeBatch,
  Timestamp,
} from 'firebase/firestore';
import { auth, firestore } from './config';
import type { AppUser } from '@/types/user';

/** Firestore needs the Auth ID token before writes; right after sign-up it can lag briefly. */
async function ensureFirestoreAuth(user: FirebaseUser): Promise<void> {
  await user.getIdToken(true);
  if (auth.currentUser?.uid !== user.uid) {
    await new Promise<void>((resolve) => {
      const timeout = setTimeout(() => resolve(), 3000);
      const unsub = onAuthStateChanged(auth, (u) => {
        if (u?.uid === user.uid) {
          clearTimeout(timeout);
          unsub();
          resolve();
        }
      });
    });
  }
}

export function firebaseAuthErrorMessage(err: unknown): string {
  const code =
    err && typeof err === 'object' && 'code' in err
      ? String((err as { code: string }).code)
      : '';

  switch (code) {
    case 'permission-denied':
      return 'Firestore denied this action. In Firebase Console open Firestore → Rules, paste Connekta/connekta-firebase/rules/firestore.rules, and Publish.';
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
    case 'auth/quota-exceeded':
      return 'Firebase Auth quota exceeded. Wait 15–30 minutes, then reopen the app. Avoid rapid reloads while developing.';
    default:
      if (err instanceof Error && err.message) return err.message;
      return 'Something went wrong. Please try again.';
  }
}

export async function isUsernameAvailable(username: string): Promise<boolean> {
  const key = username.trim().toLowerCase();
  try {
    const snap = await getDoc(doc(firestore, 'usernames', key));
    return !snap.exists();
  } catch (err: unknown) {
    const code =
      err && typeof err === 'object' && 'code' in err
        ? String((err as { code: string }).code)
        : '';
    if (code === 'permission-denied') {
      // Skip pre-check if rules require sign-in; register transaction still validates.
      return true;
    }
    throw err;
  }
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
    await ensureFirestoreAuth(cred.user);

    const usernameRef = doc(firestore, 'usernames', usernameKey);
    const userRef = doc(firestore, 'users', uid);

    const existing = await getDoc(usernameRef);
    if (existing.exists()) {
      throw new Error('Username is already taken');
    }

    const batch = writeBatch(firestore);
    batch.set(usernameRef, { uid, username: username.trim() });
    batch.set(userRef, {
      email: email.trim().toLowerCase(),
      username: username.trim(),
      deviceId,
      createdAt: Timestamp.now(),
      sharing: false,
      lat: null,
      lng: null,
      locationUpdatedAt: null,
    });
    await batch.commit();
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

/** Confirms the signed-in user knows their password (e.g. before saving biometric credentials). */
export async function verifyCurrentUserPassword(password: string): Promise<boolean> {
  const user = auth.currentUser;
  const email = user?.email;
  if (!user || !email) return false;
  try {
    await reauthenticateWithCredential(user, EmailAuthProvider.credential(email, password));
    return true;
  } catch {
    return false;
  }
}

export function firestoreErrorMessage(err: unknown): string {
  return firebaseAuthErrorMessage(err);
}

/** Subscribe to auth changes on the shared RN auth instance. */
export function subscribeToAuthState(
  callback: (user: FirebaseUser | null) => void | Promise<void>,
): () => void {
  return onAuthStateChanged(auth, callback);
}
