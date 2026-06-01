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
import { firestore } from '@/firebase/config';
import { ensureFirestoreSignedIn } from '@/firebase/firestore/friends';
import type { EmergencyContact } from '@/types/emergency';

function rowFromDoc(id: string, data: Record<string, unknown>): EmergencyContact {
  return {
    id,
    name: String(data.name ?? ''),
    phone: String(data.phone ?? ''),
    sort_order: typeof data.sortOrder === 'number' ? data.sortOrder : 0,
  };
}

export async function listEmergencyContacts(uid: string): Promise<EmergencyContact[]> {
  await ensureFirestoreSignedIn(uid);
  const snap = await getDocs(
    query(collection(firestore, 'emergencyContacts'), where('userId', '==', uid)),
  );
  const rows = snap.docs.map((d) => rowFromDoc(d.id, d.data()));
  rows.sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name));
  return rows;
}

export async function addEmergencyContact(
  uid: string,
  name: string,
  phone: string,
): Promise<EmergencyContact> {
  await ensureFirestoreSignedIn(uid);
  const existing = await listEmergencyContacts(uid);
  const ref = await addDoc(collection(firestore, 'emergencyContacts'), {
    userId: uid,
    name: name.trim(),
    phone: phone.trim(),
    sortOrder: existing.length,
    createdAt: Timestamp.now(),
  });
  return {
    id: ref.id,
    name: name.trim(),
    phone: phone.trim(),
    sort_order: existing.length,
  };
}

export async function removeEmergencyContact(uid: string, contactId: string): Promise<void> {
  await ensureFirestoreSignedIn(uid);
  await deleteDoc(doc(firestore, 'emergencyContacts', contactId));
}
