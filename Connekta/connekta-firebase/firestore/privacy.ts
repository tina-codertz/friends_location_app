import { doc, getDoc, setDoc, Timestamp, writeBatch } from 'firebase/firestore';
import { firestore } from '../config';
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

export async function readPublicUsername(uid: string): Promise<string | null> {
  const publicSnap = await getDoc(publicProfileRef(uid));
  if (publicSnap.exists()) {
    const name = publicSnap.data().username;
    if (typeof name === 'string' && name.trim()) return name.trim();
  }

  const userSnap = await getDoc(doc(firestore, 'users', uid));
  if (!userSnap.exists()) return null;
  const legacy = userSnap.data().username;
  return typeof legacy === 'string' && legacy.trim() ? legacy.trim() : null;
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
