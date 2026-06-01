import { collection, getDocs, query, where } from 'firebase/firestore';
import { auth, firestore } from '@/lib/firebase';

export async function ensureFirestoreSignedIn(uid: string): Promise<void> {
  const current = auth.currentUser;
  if (!current || current.uid !== uid) {
    throw new Error('You must be signed in.');
  }
  await current.getIdToken(true);
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
