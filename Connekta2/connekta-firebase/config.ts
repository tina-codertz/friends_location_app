import { initializeApp, getApps } from 'firebase/app';
import {
  getAuth,
  initializeAuth,
  // Metro resolves firebase/auth → @firebase/auth with RN persistence on native.
  // @ts-expect-error getReactNativePersistence exists in the RN auth bundle.
  getReactNativePersistence,
} from '@firebase/auth';
import { getFirestore, setLogLevel } from 'firebase/firestore';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

function initAuth() {
  try {
    return initializeAuth(app, {
      persistence: getReactNativePersistence(ReactNativeAsyncStorage),
    });
  } catch (e: unknown) {
    const code =
      e && typeof e === 'object' && 'code' in e ? String((e as { code: string }).code) : '';
    if (code === 'auth/already-initialized') {
      return getAuth(app);
    }
    throw e;
  }
}

export const auth = initAuth();

// BloomFilterError is an internal SDK warning when a sync optimization fails;
// Firestore automatically falls back to a full re-query. Hide WARN noise in dev.
if (__DEV__) {
  setLogLevel('error');
}

export const firestore = getFirestore(app);
export const db = firestore;
