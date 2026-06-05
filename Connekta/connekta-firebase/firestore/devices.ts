import { deleteDoc, doc, setDoc, Timestamp } from 'firebase/firestore';
import { firestore } from '../config';
import { ensureFirestoreSignedIn } from './friends';

export type DevicePushRecord = {
  expoPushToken: string;
  platform: 'ios' | 'android' | 'unknown';
  updatedAt: ReturnType<typeof Timestamp.now>;
};

function deviceRef(uid: string, deviceId: string) {
  return doc(firestore, 'users', uid, 'devices', deviceId);
}

export async function saveDevicePushToken(
  uid: string,
  deviceId: string,
  expoPushToken: string,
  platform: DevicePushRecord['platform'],
): Promise<void> {
  await ensureFirestoreSignedIn(uid);
  await setDoc(deviceRef(uid, deviceId), {
    expoPushToken,
    platform,
    updatedAt: Timestamp.now(),
  });
}

export async function removeDevicePushToken(uid: string, deviceId: string): Promise<void> {
  await ensureFirestoreSignedIn(uid);
  await deleteDoc(deviceRef(uid, deviceId)).catch(() => undefined);
}
