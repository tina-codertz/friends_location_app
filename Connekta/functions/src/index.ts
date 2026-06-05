import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { Expo, type ExpoPushMessage } from 'expo-server-sdk';
import { onDocumentCreated, onDocumentUpdated } from 'firebase-functions/v2/firestore';

initializeApp();

const db = getFirestore();
const expo = new Expo();

type PushData = {
  type: string;
  route: string;
  fromUid?: string;
};

async function readUsername(uid: string): Promise<string> {
  const publicSnap = await db.doc(`users/${uid}/public/profile`).get();
  const fromPublic = publicSnap.data()?.username;
  if (typeof fromPublic === 'string' && fromPublic.trim()) return fromPublic.trim();

  const userSnap = await db.doc(`users/${uid}`).get();
  const legacy = userSnap.data()?.username;
  if (typeof legacy === 'string' && legacy.trim()) return legacy.trim();
  return 'A circle member';
}

async function collectPushTokens(uid: string): Promise<string[]> {
  const snap = await db.collection(`users/${uid}/devices`).get();
  const tokens = snap.docs
    .map((doc) => doc.data().expoPushToken)
    .filter((token): token is string => typeof token === 'string' && Expo.isExpoPushToken(token));
  return [...new Set(tokens)];
}

async function sendPushToUser(
  uid: string,
  title: string,
  body: string,
  data: PushData,
): Promise<void> {
  const tokens = await collectPushTokens(uid);
  if (tokens.length === 0) return;

  const messages: ExpoPushMessage[] = tokens.map((to) => ({
    to,
    sound: 'default',
    title,
    body,
    data,
    priority: 'high',
  }));

  const chunks = expo.chunkPushNotifications(messages);
  for (const chunk of chunks) {
    try {
      const receipts = await expo.sendPushNotificationsAsync(chunk);
      receipts.forEach((receipt, index) => {
        if (receipt.status === 'error') {
          console.warn('[push] delivery error:', receipt.message, chunk[index]?.to);
        }
      });
    } catch (err) {
      console.warn('[push] chunk send failed:', err);
    }
  }
}

export const onFriendRequestCreated = onDocumentCreated(
  'friendRequests/{requestId}',
  async (event) => {
    const data = event.data?.data();
    if (!data || data.status !== 'pending') return;

    const fromUid = String(data.fromUid ?? '');
    const toUid = String(data.toUid ?? '');
    if (!fromUid || !toUid) return;

    const username = await readUsername(fromUid);
    await sendPushToUser(toUid, 'New circle request', `${username} wants to join your circle.`, {
      type: 'friend_request',
      route: '/(tabs)/friends',
      fromUid,
    });
  },
);

export const onFriendRequestAccepted = onDocumentUpdated(
  'friendRequests/{requestId}',
  async (event) => {
    const before = event.data?.before.data();
    const after = event.data?.after.data();
    if (!before || !after) return;
    if (before.status === 'accepted' || after.status !== 'accepted') return;

    const fromUid = String(after.fromUid ?? '');
    const toUid = String(after.toUid ?? '');
    if (!fromUid || !toUid) return;

    const username = await readUsername(toUid);
    await sendPushToUser(fromUid, 'Request accepted', `${username} joined your circle.`, {
      type: 'friend_accepted',
      route: '/(tabs)/friends',
      fromUid: toUid,
    });
  },
);
