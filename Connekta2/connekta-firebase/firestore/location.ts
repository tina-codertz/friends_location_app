import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  setDoc,
  Timestamp,
  where,
  writeBatch,
} from 'firebase/firestore';
import { firestore } from '../config';
import type { FriendLocation, LocationHistoryEntry, LocationHistoryQuery } from '@/types/location';
import { LOCATION_HISTORY_MAX_POINTS } from '@/utils/location-history';
import { coordinatesForShareMode, type ShareMode } from '@/utils/location-privacy';
import { ensureFirestoreSignedIn, getCircleMemberUids } from './friends';
import {
  locationCurrentRef,
  locationPrivateRef,
  migrateLegacyPrivacyDocs,
  parseShareMode,
  readPublicUsername,
} from './privacy';

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

async function readPrivateLocation(uid: string): Promise<Record<string, unknown> | null> {
  await migrateLegacyPrivacyDocs(uid);
  const snap = await getDoc(locationPrivateRef(uid));
  if (snap.exists()) return snap.data();

  const legacy = await getDoc(doc(firestore, 'users', uid));
  return legacy.exists() ? legacy.data()! : null;
}

async function syncCurrentLocationDoc(
  uid: string,
  exactLat: number,
  exactLng: number,
  privateData: Record<string, unknown>,
  now: Timestamp,
): Promise<void> {
  const sharing = isShareActive(privateData);
  const shareMode = parseShareMode(privateData.shareMode);

  if (!sharing || shareMode === 'paused') {
    await setDoc(
      locationCurrentRef(uid),
      { sharing: false, lat: null, lng: null, locationUpdatedAt: null },
      { merge: true },
    );
    return;
  }

  const display = coordinatesForShareMode(exactLat, exactLng, shareMode);
  await setDoc(
    locationCurrentRef(uid),
    {
      lat: display.lat,
      lng: display.lng,
      sharing: true,
      locationUpdatedAt: now,
    },
    { merge: true },
  );
}

export async function getMyLocationState(uid: string): Promise<{
  success: boolean;
  sharing: boolean;
  lat: number | null;
  lng: number | null;
  updated_at: string | null;
  share_until: string | null;
  share_mode: ShareMode;
}> {
  await ensureFirestoreSignedIn(uid);
  const d = await readPrivateLocation(uid);
  if (!d) {
    return {
      success: true,
      sharing: false,
      lat: null,
      lng: null,
      updated_at: null,
      share_until: null,
      share_mode: 'paused',
    };
  }

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
    share_mode: parseShareMode(d.shareMode),
  };
}

export async function setLocationSharing(
  uid: string,
  enabled: boolean,
  shareUntilIso?: string | null,
): Promise<{ success: boolean; sharing: boolean }> {
  await ensureFirestoreSignedIn(uid);
  await migrateLegacyPrivacyDocs(uid);

  const now = Timestamp.now();
  const privateSnap = await getDoc(locationPrivateRef(uid));
  const shareMode = privateSnap.exists()
    ? parseShareMode(privateSnap.data().shareMode)
    : 'exact';
  const nextMode: ShareMode = enabled
    ? shareMode === 'paused'
      ? 'exact'
      : shareMode
    : 'paused';

  await setDoc(
    locationPrivateRef(uid),
    {
      sharing: enabled,
      shareUntil: enabled ? timestampFromIso(shareUntilIso) : null,
      shareMode: nextMode,
      sharingUpdatedAt: now,
    },
    { merge: true },
  );

  if (!enabled) {
    await setDoc(
      locationCurrentRef(uid),
      { sharing: false, lat: null, lng: null, locationUpdatedAt: null },
      { merge: true },
    );
    return { success: true, sharing: false };
  }

  const lat = privateSnap.data()?.lat;
  const lng = privateSnap.data()?.lng;
  if (typeof lat === 'number' && typeof lng === 'number') {
    await syncCurrentLocationDoc(uid, lat, lng, {
      sharing: true,
      shareUntil: timestampFromIso(shareUntilIso),
      shareMode: nextMode,
    }, now);
  } else {
    await setDoc(locationCurrentRef(uid), { sharing: true }, { merge: true });
  }

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
  await migrateLegacyPrivacyDocs(uid);

  const privateSnap = await getDoc(locationPrivateRef(uid));
  const privateData = privateSnap.data() ?? {};
  if (!isShareActive(privateData) || parseShareMode(privateData.shareMode) === 'paused') {
    return { success: true };
  }

  const source = options.source ?? 'foreground';
  const accuracy = typeof options.accuracy === 'number' && Number.isFinite(options.accuracy)
    ? options.accuracy
    : null;
  const now = Timestamp.now();

  await setDoc(
    locationPrivateRef(uid),
    { lat, lng, locationUpdatedAt: now },
    { merge: true },
  );
  await syncCurrentLocationDoc(uid, lat, lng, privateData, now);

  try {
    const historyBatch = writeBatch(firestore);
    historyBatch.set(doc(collection(firestore, 'users', uid, 'locationHistory')), {
      lat,
      lng,
      accuracy,
      source,
      createdAt: now,
    });
    await historyBatch.commit();
  } catch (err) {
    console.warn('[pingLocation] history write failed:', err);
  }

  return { success: true };
}

export async function listFriendLocations(uid: string): Promise<FriendLocation[]> {
  await ensureFirestoreSignedIn(uid);
  const members = await getCircleMemberUids(uid);
  const out: FriendLocation[] = [];

  for (const friendUid of members) {
    if (friendUid === uid) continue;

    let currentData: Record<string, unknown> | null = null;
    try {
      const currentSnap = await getDoc(locationCurrentRef(friendUid));
      if (currentSnap.exists()) currentData = currentSnap.data();
    } catch {
      continue;
    }

    if (!currentData || currentData.sharing !== true) continue;
    if (typeof currentData.lat !== 'number' || typeof currentData.lng !== 'number') continue;

    const username = (await readPublicUsername(friendUid)) ?? 'Friend';
    out.push({
      id: friendUid,
      username,
      lat: currentData.lat,
      lng: currentData.lng,
      updated_at: updatedAtIso(currentData),
      share_until: null,
    });
  }

  return out;
}

export async function updateShareMode(
  uid: string,
  mode: ShareMode,
): Promise<{ success: boolean; sharing: boolean }> {
  await ensureFirestoreSignedIn(uid);
  await migrateLegacyPrivacyDocs(uid);

  if (mode === 'paused') {
    await setLocationSharing(uid, false, null);
    return { success: true, sharing: false };
  }

  const privateSnap = await getDoc(locationPrivateRef(uid));
  const privateData = privateSnap.data() ?? {};
  const now = Timestamp.now();

  await setDoc(
    locationPrivateRef(uid),
    { shareMode: mode, sharingUpdatedAt: now },
    { merge: true },
  );

  const lat = privateData.lat;
  const lng = privateData.lng;
  if (
    isShareActive({ ...privateData, shareMode: mode })
    && typeof lat === 'number'
    && typeof lng === 'number'
  ) {
    await syncCurrentLocationDoc(
      uid,
      lat,
      lng,
      { ...privateData, shareMode: mode },
      now,
    );
  }

  return { success: true, sharing: isShareActive({ ...privateData, shareMode: mode }) };
}

export async function listMyLocationHistory(
  uid: string,
  options: LocationHistoryQuery | number = {},
): Promise<LocationHistoryEntry[]> {
  await ensureFirestoreSignedIn(uid);
  const resolved =
    typeof options === 'number' ? { max: options } : options;
  const max = Math.max(1, Math.min(resolved.max ?? 100, LOCATION_HISTORY_MAX_POINTS));
  const sinceMs = resolved.sinceMs;

  const historyRef = collection(firestore, 'users', uid, 'locationHistory');
  const snap = await getDocs(
    sinceMs != null && Number.isFinite(sinceMs)
      ? query(
          historyRef,
          where('createdAt', '>=', Timestamp.fromMillis(sinceMs)),
          orderBy('createdAt', 'desc'),
          limit(max),
        )
      : query(historyRef, orderBy('createdAt', 'desc'), limit(max)),
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
