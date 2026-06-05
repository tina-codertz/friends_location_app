import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  Timestamp,
  updateDoc,
  writeBatch,
} from 'firebase/firestore';
import { firestore } from '../config';
import type { FriendLocation, LocationHistoryEntry } from '@/types/location';
import { ensureFirestoreSignedIn, getCircleMemberUids } from './friends';

function updatedAtIso(data: Record<string, unknown>): string {
  const u = data.locationUpdatedAt;
  if (u instanceof Timestamp) return u.toDate().toISOString();
  if (typeof u === 'string') return u;
  return new Date().toISOString();
}

function timestampIso(value: unknown): string | null {
  if (value instanceof Timestamp) return value.toDate().toISOString();
  if (typeof value === 'string') return value;
  return null;
}

function timestampFromIso(value?: string | null): Timestamp | null {
  if (!value) return null;
  const ms = Date.parse(value);
  if (!Number.isFinite(ms)) return null;
  return Timestamp.fromDate(new Date(ms));
}

function isShareActive(data: Record<string, unknown>): boolean {
  if (!data.sharing) return false;
  const shareUntil = data.shareUntil;
  if (!shareUntil) return true;
  if (shareUntil instanceof Timestamp) return shareUntil.toMillis() > Date.now();
  if (typeof shareUntil === 'string') return Date.parse(shareUntil) > Date.now();
  return true;
}

export async function getMyLocationState(uid: string): Promise<{
  success: boolean;
  sharing: boolean;
  lat: number | null;
  lng: number | null;
  updated_at: string | null;
  share_until: string | null;
}> {
  await ensureFirestoreSignedIn(uid);
  const snap = await getDoc(doc(firestore, 'users', uid));
  if (!snap.exists()) {
    return { success: true, sharing: false, lat: null, lng: null, updated_at: null, share_until: null };
  }
  const d = snap.data()!;
  const lat = typeof d.lat === 'number' ? d.lat : null;
  const lng = typeof d.lng === 'number' ? d.lng : null;
  const active = isShareActive(d);
  return {
    success: true,
    sharing: active,
    lat,
    lng,
    updated_at: lat != null && lng != null ? updatedAtIso(d) : null,
    share_until: timestampIso(d.shareUntil),
  };
}

export async function setLocationSharing(
  uid: string,
  enabled: boolean,
  shareUntilIso?: string | null,
): Promise<{ success: boolean; sharing: boolean }> {
  await ensureFirestoreSignedIn(uid);
  await updateDoc(doc(firestore, 'users', uid), {
    sharing: enabled,
    shareUntil: enabled ? timestampFromIso(shareUntilIso) : null,
    sharingUpdatedAt: Timestamp.now(),
  });
  return { success: true, sharing: enabled };
}

export async function pingLocation(
  uid: string,
  lat: number,
  lng: number,
  options: { accuracy?: number | null; source?: LocationHistoryEntry['source'] } = {},
): Promise<{ success: boolean; message?: string }> {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return { success: false, message: 'Invalid coordinates' };
  }
  await ensureFirestoreSignedIn(uid);

  const source = options.source ?? 'foreground';
  const accuracy = typeof options.accuracy === 'number' && Number.isFinite(options.accuracy)
    ? options.accuracy
    : null;
  const now = Timestamp.now();
  const batch = writeBatch(firestore);
  batch.update(doc(firestore, 'users', uid), {
    lat,
    lng,
    locationUpdatedAt: now,
  });
  batch.set(doc(collection(firestore, 'users', uid, 'locationHistory')), {
    lat,
    lng,
    accuracy,
    source,
    createdAt: now,
  });
  await batch.commit();
  return { success: true };
}

export async function listFriendLocations(uid: string): Promise<FriendLocation[]> {
  await ensureFirestoreSignedIn(uid);
  const members = await getCircleMemberUids(uid);
  const out: FriendLocation[] = [];

  for (const friendUid of members) {
    if (friendUid === uid) continue;
    const snap = await getDoc(doc(firestore, 'users', friendUid));
    if (!snap.exists()) continue;
    const d = snap.data()!;
    if (!isShareActive(d) || typeof d.lat !== 'number' || typeof d.lng !== 'number') continue;
    out.push({
      id: friendUid,
      username: String(d.username ?? ''),
      lat: d.lat,
      lng: d.lng,
      updated_at: updatedAtIso(d),
      share_until: timestampIso(d.shareUntil),
    });
  }

  return out;
}

export async function listMyLocationHistory(
  uid: string,
  max = 100,
): Promise<LocationHistoryEntry[]> {
  await ensureFirestoreSignedIn(uid);
  const snap = await getDocs(
    query(
      collection(firestore, 'users', uid, 'locationHistory'),
      orderBy('createdAt', 'desc'),
      limit(Math.max(1, Math.min(max, 250))),
    ),
  );

  return snap.docs.map((entry) => {
    const d = entry.data();
    const createdAt = d.createdAt;
    return {
      id: entry.id,
      latitude: typeof d.lat === 'number' ? d.lat : 0,
      longitude: typeof d.lng === 'number' ? d.lng : 0,
      accuracy: typeof d.accuracy === 'number' ? d.accuracy : null,
      source: d.source === 'background' || d.source === 'manual' || d.source === 'app-open'
        ? d.source
        : 'foreground',
      timestamp:
        createdAt instanceof Timestamp
          ? createdAt.toDate().toISOString()
          : new Date().toISOString(),
    };
  });
}
