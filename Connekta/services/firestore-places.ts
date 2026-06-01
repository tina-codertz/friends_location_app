import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  where,
  Timestamp,
} from 'firebase/firestore';
import { auth, firestore } from '@/lib/firebase';
import type { SavedPlace } from '@/types/places';

function rowFromDoc(
  id: string,
  data: Record<string, unknown>,
): SavedPlace {
  const created = data.createdAt;
  const created_at =
    created instanceof Timestamp
      ? created.toDate().toISOString()
      : typeof created === 'string'
        ? created
        : new Date().toISOString();

  return {
    id,
    userId: String(data.userId ?? ''),
    username: String(data.username ?? ''),
    name: String(data.name ?? ''),
    lat: Number(data.lat),
    lng: Number(data.lng),
    created_at,
  };
}

async function ensureSignedIn(uid: string): Promise<void> {
  const current = auth.currentUser;
  if (!current || current.uid !== uid) {
    throw new Error('You must be signed in to save places.');
  }
  await current.getIdToken(true);
}

async function friendUids(uid: string): Promise<string[]> {
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

/** Places owned by the current user. */
export async function listMyPlaces(uid: string): Promise<SavedPlace[]> {
  await ensureSignedIn(uid);
  const snap = await getDocs(
    query(collection(firestore, 'places'), where('userId', '==', uid)),
  );
  const rows = snap.docs.map((d) => rowFromDoc(d.id, d.data()));
  rows.sort((a, b) => b.created_at.localeCompare(a.created_at));
  return rows;
}

/** Own places + friends' places (circle). */
export async function listCirclePlaces(uid: string): Promise<SavedPlace[]> {
  await ensureSignedIn(uid);
  const uids = await friendUids(uid);
  const all: SavedPlace[] = [];

  const chunkSize = 10;
  for (let i = 0; i < uids.length; i += chunkSize) {
    const chunk = uids.slice(i, i + chunkSize);
    const snap = await getDocs(
      query(collection(firestore, 'places'), where('userId', 'in', chunk)),
    );
    snap.docs.forEach((d) => all.push(rowFromDoc(d.id, d.data())));
  }

  all.sort((a, b) => {
    const byUser = a.username.localeCompare(b.username);
    if (byUser !== 0) return byUser;
    return b.created_at.localeCompare(a.created_at);
  });
  return all;
}

export async function createPlace(
  uid: string,
  username: string,
  name: string,
  lat: number,
  lng: number,
): Promise<SavedPlace> {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    throw new Error('Invalid map location. Tap the map to set a pin.');
  }

  await ensureSignedIn(uid);

  const trimmedName = name.trim();
  const createdAt = Timestamp.now();

  const ref = await addDoc(collection(firestore, 'places'), {
    userId: uid,
    username: username.trim() || 'user',
    name: trimmedName,
    lat,
    lng,
    createdAt,
  });

  return rowFromDoc(ref.id, {
    userId: uid,
    username: username.trim() || 'user',
    name: trimmedName,
    lat,
    lng,
    createdAt,
  });
}

export async function deletePlace(placeId: string): Promise<void> {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('You must be signed in.');
  await ensureSignedIn(uid);
  await deleteDoc(doc(firestore, 'places', placeId));
}
