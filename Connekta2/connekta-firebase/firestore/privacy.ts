import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  setDoc,
  Timestamp,
  where,
  writeBatch,
} from 'firebase/firestore';
import { auth, firestore } from '../config';
import { coordinatesForShareMode, type ShareMode } from '@/utils/location-privacy';

export const PUBLIC_PROFILE_PATH = 'profile' as const;
export const LOCATION_PRIVATE_PATH = 'private' as const;
export const LOCATION_CURRENT_PATH = 'current' as const;

function publicProfileRef(uid: string) {
  return doc(firestore, 'users', uid, 'public', PUBLIC_PROFILE_PATH);
}

function locationPrivateRef(uid: string) {
  return doc(firestore, 'users', uid, 'location', LOCATION_PRIVATE_PATH);
}

function locationCurrentRef(uid: string) {
  return doc(firestore, 'users', uid, 'location', LOCATION_CURRENT_PATH);
}

function parseShareMode(value: unknown): ShareMode {
  if (value === 'bubble' || value === 'paused') return value;
  return 'exact';
}

/** Copies legacy root `users/{uid}` location fields into circle-scoped subdocs. */
export async function migrateLegacyPrivacyDocs(uid: string): Promise<void> {
  const privateSnap = await getDoc(locationPrivateRef(uid));
  if (privateSnap.exists()) return;

  const userSnap = await getDoc(doc(firestore, 'users', uid));
  if (!userSnap.exists()) return;

  const d = userSnap.data();
  const username = String(d.username ?? '');
  const lat = typeof d.lat === 'number' ? d.lat : null;
  const lng = typeof d.lng === 'number' ? d.lng : null;
  const sharing = d.sharing === true;
  const shareMode: ShareMode = sharing ? 'exact' : 'paused';

  const batch = writeBatch(firestore);
  batch.set(publicProfileRef(uid), { username }, { merge: true });
  batch.set(locationPrivateRef(uid), {
    lat,
    lng,
    sharing,
    shareUntil: d.shareUntil ?? null,
    shareMode,
    locationUpdatedAt: d.locationUpdatedAt ?? null,
    sharingUpdatedAt: d.sharingUpdatedAt ?? null,
  });

  if (lat != null && lng != null && sharing) {
    const display = coordinatesForShareMode(lat, lng, shareMode);
    batch.set(locationCurrentRef(uid), {
      lat: display.lat,
      lng: display.lng,
      sharing: true,
      locationUpdatedAt: d.locationUpdatedAt ?? Timestamp.now(),
    });
  } else {
    batch.set(locationCurrentRef(uid), {
      lat: null,
      lng: null,
      sharing: false,
      locationUpdatedAt: null,
    });
  }

  await batch.commit();
}

export async function ensurePublicProfile(uid: string, username: string): Promise<void> {
  await setDoc(publicProfileRef(uid), { username }, { merge: true });
}

async function lookupUsernameByUid(uid: string): Promise<string | null> {
  try {
    const snap = await getDocs(
      query(collection(firestore, 'usernames'), where('uid', '==', uid), limit(1)),
    );
    if (snap.empty) return null;
    const name = snap.docs[0].data().username;
    return typeof name === 'string' && name.trim() ? name.trim() : null;
  } catch {
    return null;
  }
}

export async function readPublicUsername(uid: string): Promise<string | null> {
  try {
    const publicSnap = await getDoc(publicProfileRef(uid));
    if (publicSnap.exists()) {
      const name = publicSnap.data().username;
      if (typeof name === 'string' && name.trim()) return name.trim();
    }
  } catch {
    /* network or rules */
  }

  const fromRegistry = await lookupUsernameByUid(uid);
  if (fromRegistry) return fromRegistry;

  // Root user doc is owner-only — never read another member's private profile.
  if (auth.currentUser?.uid === uid) {
    try {
      const userSnap = await getDoc(doc(firestore, 'users', uid));
      if (userSnap.exists()) {
        const legacy = userSnap.data().username;
        if (typeof legacy === 'string' && legacy.trim()) return legacy.trim();
      }
    } catch {
      /* ignore */
    }
  }

  return null;
}

export async function getShareMode(uid: string): Promise<ShareMode> {
  await migrateLegacyPrivacyDocs(uid);
  const snap = await getDoc(locationPrivateRef(uid));
  if (!snap.exists()) return 'paused';
  return parseShareMode(snap.data().shareMode);
}

export {
  locationPrivateRef,
  locationCurrentRef,
  publicProfileRef,
  parseShareMode,
};
