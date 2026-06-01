import { doc, getDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { firestore } from '../config';
import type { FriendLocation } from '@/types/location';
import { ensureFirestoreSignedIn, getCircleMemberUids } from './friends';

function updatedAtIso(data: Record<string, unknown>): string {
  const u = data.locationUpdatedAt;
  if (u instanceof Timestamp) return u.toDate().toISOString();
  if (typeof u === 'string') return u;
  return new Date().toISOString();
}

export async function getMyLocationState(uid: string): Promise<{
  success: boolean;
  sharing: boolean;
  lat: number | null;
  lng: number | null;
  updated_at: string | null;
}> {
  await ensureFirestoreSignedIn(uid);
  const snap = await getDoc(doc(firestore, 'users', uid));
  if (!snap.exists()) {
    return { success: true, sharing: false, lat: null, lng: null, updated_at: null };
  }
  const d = snap.data()!;
  const lat = typeof d.lat === 'number' ? d.lat : null;
  const lng = typeof d.lng === 'number' ? d.lng : null;
  return {
    success: true,
    sharing: !!d.sharing,
    lat,
    lng,
    updated_at: lat != null && lng != null ? updatedAtIso(d) : null,
  };
}

export async function setLocationSharing(
  uid: string,
  enabled: boolean,
): Promise<{ success: boolean; sharing: boolean }> {
  await ensureFirestoreSignedIn(uid);
  await updateDoc(doc(firestore, 'users', uid), { sharing: enabled });
  return { success: true, sharing: enabled };
}

export async function pingLocation(
  uid: string,
  lat: number,
  lng: number,
): Promise<{ success: boolean; message?: string }> {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return { success: false, message: 'Invalid coordinates' };
  }
  await ensureFirestoreSignedIn(uid);
  await updateDoc(doc(firestore, 'users', uid), {
    lat,
    lng,
    locationUpdatedAt: Timestamp.now(),
  });
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
    if (!d.sharing || typeof d.lat !== 'number' || typeof d.lng !== 'number') continue;
    out.push({
      id: friendUid,
      username: String(d.username ?? ''),
      lat: d.lat,
      lng: d.lng,
      updated_at: updatedAtIso(d),
    });
  }

  return out;
}
