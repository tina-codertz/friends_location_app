import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  updateDoc,
  where,
  Timestamp,
  documentId,
} from 'firebase/firestore';
import { firestore } from '@/firebase/config';
import { friendshipDocId } from '@/firebase/ids';
import { ensureFirestoreSignedIn } from '@/firebase/firestore/friends';
import type { FriendUser } from '@/types/friends';

const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function randomCode(length = 8): string {
  let out = '';
  for (let i = 0; i < length; i++) {
    out += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  }
  return out;
}

async function userProfile(uid: string): Promise<FriendUser | null> {
  const snap = await getDoc(doc(firestore, 'users', uid));
  if (!snap.exists()) return null;
  return { id: uid, username: String(snap.data()?.username ?? 'user') };
}

async function areFriends(a: string, b: string): Promise<boolean> {
  const snap = await getDoc(doc(firestore, 'friendships', friendshipDocId(a, b)));
  return snap.exists();
}

async function findRequestBetween(
  a: string,
  b: string,
): Promise<{ id: string; fromUid: string; toUid: string; status: string } | null> {
  const [ab, ba] = await Promise.all([
    getDocs(
      query(
        collection(firestore, 'friendRequests'),
        where('fromUid', '==', a),
        where('toUid', '==', b),
      ),
    ),
    getDocs(
      query(
        collection(firestore, 'friendRequests'),
        where('fromUid', '==', b),
        where('toUid', '==', a),
      ),
    ),
  ]);
  const docSnap = ab.docs[0] ?? ba.docs[0];
  if (!docSnap) return null;
  const d = docSnap.data();
  return {
    id: docSnap.id,
    fromUid: String(d.fromUid),
    toUid: String(d.toUid),
    status: String(d.status),
  };
}

async function createFriendship(a: string, b: string): Promise<void> {
  const pairId = friendshipDocId(a, b);
  const memberIds = a < b ? [a, b] : [b, a];
  await setDoc(doc(firestore, 'friendships', pairId), {
    memberIds,
    createdAt: Timestamp.now(),
  });
}

export async function searchUsers(
  uid: string,
  searchQuery: string,
  limit = 20,
): Promise<FriendUser[]> {
  await ensureFirestoreSignedIn(uid);
  const prefix = searchQuery.trim().toLowerCase();
  if (prefix.length < 2) return [];

  const snap = await getDocs(
    query(
      collection(firestore, 'usernames'),
      where(documentId(), '>=', prefix),
      where(documentId(), '<=', prefix + '\uf8ff'),
    ),
  );

  const out: FriendUser[] = [];
  for (const d of snap.docs) {
    const otherUid = String(d.data().uid ?? '');
    if (!otherUid || otherUid === uid) continue;
    if (await areFriends(uid, otherUid)) continue;
    const profile = await userProfile(otherUid);
    if (profile) out.push(profile);
    if (out.length >= limit) break;
  }
  return out;
}

export async function listFriends(uid: string): Promise<FriendUser[]> {
  await ensureFirestoreSignedIn(uid);
  const snap = await getDocs(
    query(collection(firestore, 'friendships'), where('memberIds', 'array-contains', uid)),
  );
  const out: FriendUser[] = [];
  for (const d of snap.docs) {
    const members = (d.data().memberIds as string[]) ?? [];
    const other = members.find((m) => m !== uid);
    if (!other) continue;
    const profile = await userProfile(other);
    if (profile) out.push(profile);
  }
  out.sort((a, b) => a.username.localeCompare(b.username));
  return out;
}

export async function listIncoming(uid: string): Promise<FriendUser[]> {
  await ensureFirestoreSignedIn(uid);
  const snap = await getDocs(
    query(
      collection(firestore, 'friendRequests'),
      where('toUid', '==', uid),
      where('status', '==', 'pending'),
    ),
  );
  const out: FriendUser[] = [];
  for (const d of snap.docs) {
    const fromUid = String(d.data().fromUid);
    const profile = await userProfile(fromUid);
    if (profile) out.push(profile);
  }
  return out;
}

export async function sendFriendRequest(
  fromUid: string,
  toUid: string,
): Promise<{ success: boolean; message?: string }> {
  await ensureFirestoreSignedIn(fromUid);
  if (fromUid === toUid) {
    return { success: false, message: 'Cannot add yourself' };
  }
  if (await areFriends(fromUid, toUid)) {
    return { success: true, message: 'Already in your circle' };
  }

  const existing = await findRequestBetween(fromUid, toUid);
  if (existing) {
    if (existing.status === 'pending') {
      if (existing.fromUid === toUid && existing.toUid === fromUid) {
        return acceptFriendRequest(fromUid, toUid);
      }
      return { success: false, message: 'Request already pending' };
    }
    if (existing.status === 'accepted') {
      return { success: false, message: 'Already connected' };
    }
    if (existing.status === 'rejected') {
      await deleteDoc(doc(firestore, 'friendRequests', existing.id));
    }
  }

  await addDoc(collection(firestore, 'friendRequests'), {
    fromUid,
    toUid,
    status: 'pending',
    createdAt: Timestamp.now(),
  });
  return { success: true, message: 'Friend request sent' };
}

export async function acceptFriendRequest(
  currentUid: string,
  fromUid: string,
): Promise<{ success: boolean; message?: string }> {
  await ensureFirestoreSignedIn(currentUid);
  if (await areFriends(fromUid, currentUid)) {
    return { success: true, message: 'Already in your circle' };
  }

  const snap = await getDocs(
    query(
      collection(firestore, 'friendRequests'),
      where('fromUid', '==', fromUid),
      where('toUid', '==', currentUid),
      where('status', '==', 'pending'),
    ),
  );
  const req = snap.docs[0];
  if (!req) {
    return { success: false, message: 'No pending request' };
  }

  await updateDoc(req.ref, { status: 'accepted' });
  await createFriendship(fromUid, currentUid);
  return { success: true, message: 'Friend request accepted' };
}

export async function rejectFriendRequest(
  currentUid: string,
  fromUid: string,
): Promise<{ success: boolean; message?: string }> {
  await ensureFirestoreSignedIn(currentUid);
  const snap = await getDocs(
    query(
      collection(firestore, 'friendRequests'),
      where('fromUid', '==', fromUid),
      where('toUid', '==', currentUid),
      where('status', '==', 'pending'),
    ),
  );
  const req = snap.docs[0];
  if (!req) {
    return { success: false, message: 'No pending request' };
  }
  await updateDoc(req.ref, { status: 'rejected' });
  return { success: true, message: 'Request rejected' };
}

export async function removeFriend(
  currentUid: string,
  friendUid: string,
): Promise<{ success: boolean; message?: string }> {
  await ensureFirestoreSignedIn(currentUid);
  if (currentUid === friendUid) {
    return { success: false, message: 'Cannot remove yourself' };
  }
  if (!(await areFriends(currentUid, friendUid))) {
    return { success: false, message: 'This user is not in your circle' };
  }

  await deleteDoc(doc(firestore, 'friendships', friendshipDocId(currentUid, friendUid)));

  const existing = await findRequestBetween(currentUid, friendUid);
  if (existing) {
    await deleteDoc(doc(firestore, 'friendRequests', existing.id));
  }

  return { success: true, message: 'Member removed from your circle' };
}

export async function getInvite(uid: string): Promise<{
  code: string;
  expires_at: string | null;
  created_at: string;
} | null> {
  await ensureFirestoreSignedIn(uid);
  const snap = await getDocs(
    query(collection(firestore, 'circleInvites'), where('ownerUid', '==', uid)),
  );
  const row = snap.docs[0];
  if (!row) return null;
  const d = row.data();
  const exp = d.expiresAt;
  if (exp instanceof Timestamp && exp.toDate().getTime() < Date.now()) {
    return null;
  }
  const created = d.createdAt;
  return {
    code: row.id,
    expires_at: exp instanceof Timestamp ? exp.toDate().toISOString() : null,
    created_at:
      created instanceof Timestamp ? created.toDate().toISOString() : new Date().toISOString(),
  };
}

export async function generateInvite(
  uid: string,
  ttlDays = 30,
): Promise<{ success: boolean; code?: string; expires_at?: string; message?: string }> {
  await ensureFirestoreSignedIn(uid);
  const existing = await getDocs(
    query(collection(firestore, 'circleInvites'), where('ownerUid', '==', uid)),
  );
  await Promise.all(existing.docs.map((d) => deleteDoc(d.ref)));

  const expiresAt = Timestamp.fromDate(new Date(Date.now() + ttlDays * 24 * 60 * 60 * 1000));

  for (let attempt = 0; attempt < 8; attempt++) {
    const code = randomCode(8);
    try {
      await setDoc(doc(firestore, 'circleInvites', code), {
        ownerUid: uid,
        expiresAt,
        createdAt: Timestamp.now(),
      });
      return {
        success: true,
        code,
        expires_at: expiresAt.toDate().toISOString(),
      };
    } catch {
      /* code collision */
    }
  }
  return { success: false, message: 'Could not generate unique code' };
}

export async function joinWithInviteCode(
  uid: string,
  code: string,
): Promise<{ success: boolean; message?: string; circle_owner?: FriendUser }> {
  await ensureFirestoreSignedIn(uid);
  const normalized = code.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (normalized.length < 6) {
    return { success: false, message: 'Invalid or expired code' };
  }

  const inviteSnap = await getDoc(doc(firestore, 'circleInvites', normalized));
  if (!inviteSnap.exists()) {
    return { success: false, message: 'Invalid or expired code' };
  }
  const d = inviteSnap.data();
  const ownerUid = String(d.ownerUid);
  const exp = d.expiresAt;
  if (exp instanceof Timestamp && exp.toDate().getTime() < Date.now()) {
    return { success: false, message: 'Invalid or expired code' };
  }

  const owner = await userProfile(ownerUid);
  const result = await sendFriendRequest(uid, ownerUid);
  return {
    ...result,
    circle_owner: owner ?? undefined,
  };
}
