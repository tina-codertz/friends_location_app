/**
 * App data facade — Firestore-backed helpers used by screens and hooks.
 */

import { auth, firebaseAuthErrorMessage, isAuthQuotaExceeded, loadAppUser } from '@/connekta-firebase';
import * as firestoreCircle from '@/connekta-firebase/firestore/circle';
import {
  addEmergencyContact,
  listEmergencyContacts,
  removeEmergencyContact,
} from '@/connekta-firebase/firestore/emergency';
import {
  getMyLocationState,
  listMyLocationHistory,
  listFriendLocations,
  pingLocation,
  setLocationSharing,
} from '@/connekta-firebase/firestore/location';
import type { FriendUser } from '@/types/friends';
import type { FriendLocation, LocationHistoryEntry, LocationHistoryQuery } from '@/types/location';
import type { EmergencyContact } from '@/types/emergency';

export type { FriendUser, FriendLocation, LocationHistoryEntry, EmergencyContact };

let lastQuotaWarnAt = 0;

function warnApiFailure(tag: string, err: unknown): void {
  if (isAuthQuotaExceeded(err)) {
    const now = Date.now();
    if (now - lastQuotaWarnAt < 120_000) return;
    lastQuotaWarnAt = now;
    console.warn(
      `[${tag}] Firebase Auth quota exceeded — pausing token refresh. Wait ~15 min or check Firebase Console → Usage.`,
    );
    return;
  }
  console.warn(`[${tag}] failed:`, err);
}

export function getApiErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof Error && err.message.trim().length > 0) return err.message;
  return fallback;
}

/** Friends & circle invites (Firestore). */
export const friendsAPI = {
  async accept(from_user_id: string): Promise<{ success: boolean; message?: string }> {
    try {
      const uid = auth.currentUser?.uid;
      if (!uid) return { success: false, message: 'Not signed in' };
      return await firestoreCircle.acceptFriendRequest(uid, from_user_id);
    } catch (err) {
      console.warn('[friendsAPI] accept failed:', err);
      return { success: false, message: 'Could not accept request' };
    }
  },
  async reject(from_user_id: string): Promise<{ success: boolean; message?: string }> {
    try {
      const uid = auth.currentUser?.uid;
      if (!uid) return { success: false, message: 'Not signed in' };
      return await firestoreCircle.rejectFriendRequest(uid, from_user_id);
    } catch (err) {
      console.warn('[friendsAPI] reject failed:', err);
      return { success: false, message: 'Could not decline request' };
    }
  },
  async list(): Promise<{ success: boolean; friends: FriendUser[] }> {
    try {
      const uid = auth.currentUser?.uid;
      if (!uid) return { success: false, friends: [] };
      const friends = await firestoreCircle.listFriends(uid);
      return { success: true, friends };
    } catch (err) {
      warnApiFailure('friendsAPI.list', err);
      return { success: false, friends: [] };
    }
  },
  async remove(friendId: string): Promise<{ success: boolean; message?: string }> {
    try {
      const uid = auth.currentUser?.uid;
      if (!uid) return { success: false, message: 'Not signed in' };
      return await firestoreCircle.removeFriend(uid, friendId);
    } catch (err) {
      console.warn('[friendsAPI] remove failed:', err);
      return { success: false, message: 'Could not remove friend' };
    }
  },
  async incoming(): Promise<{ success: boolean; incoming: FriendUser[] }> {
    try {
      const uid = auth.currentUser?.uid;
      if (!uid) return { success: false, incoming: [] };
      const incoming = await firestoreCircle.listIncoming(uid);
      return { success: true, incoming };
    } catch (err) {
      warnApiFailure('friendsAPI.incoming', err);
      return { success: false, incoming: [] };
    }
  },
  async getInvite(): Promise<{
    success: boolean;
    invite: { code: string; expires_at: string | null; created_at: string } | null;
  }> {
    try {
      const uid = auth.currentUser?.uid;
      if (!uid) return { success: false, invite: null };
      const invite = await firestoreCircle.getInvite(uid);
      return { success: true, invite };
    } catch (err) {
      console.warn('[friendsAPI] getInvite failed:', err);
      return { success: false, invite: null };
    }
  },
  async generateInvite(): Promise<{ success: boolean; code?: string; expires_at?: string; message?: string }> {
    try {
      const uid = auth.currentUser?.uid;
      if (!uid) return { success: false, message: 'Not signed in' };
      return await firestoreCircle.generateInvite(uid);
    } catch (err) {
      console.warn('[friendsAPI] generateInvite failed:', err);
      return { success: false, message: 'Could not generate code' };
    }
  },
  async joinWithCode(code: string): Promise<{
    success: boolean;
    message?: string;
    circle_owner?: FriendUser;
  }> {
    try {
      const uid = auth.currentUser?.uid;
      if (!uid) return { success: false, message: 'Not signed in' };
      return await firestoreCircle.joinWithInviteCode(uid, code);
    } catch (err) {
      console.warn('[friendsAPI] joinWithCode failed:', err);
      return { success: false, message: firebaseAuthErrorMessage(err) };
    }
  },
};

/** Location sharing (`users/{uid}` in Firestore). */
export const locationAPI = {
  async setSharing(
    enabled: boolean,
    shareUntilIso?: string | null,
  ): Promise<{ success: boolean; sharing: boolean }> {
    try {
      const uid = auth.currentUser?.uid;
      if (!uid) return { success: false, sharing: false };
      return await setLocationSharing(uid, enabled, shareUntilIso);
    } catch (err) {
      warnApiFailure('locationAPI.setSharing', err);
      return { success: false, sharing: !enabled };
    }
  },
  async ping(
    lat: number,
    lng: number,
    options?: { accuracy?: number | null; source?: LocationHistoryEntry['source'] },
  ): Promise<{ success: boolean; message?: string }> {
    try {
      const uid = auth.currentUser?.uid;
      if (!uid) return { success: false, message: 'Not signed in' };
      return await pingLocation(uid, lat, lng, options);
    } catch (err) {
      warnApiFailure('locationAPI.ping', err);
      return { success: false, message: 'Could not update location' };
    }
  },
  async friendsLocations(): Promise<{ success: boolean; locations: FriendLocation[] }> {
    try {
      const uid = auth.currentUser?.uid;
      if (!uid) return { success: false, locations: [] };
      const locations = await listFriendLocations(uid);
      return { success: true, locations };
    } catch (err) {
      warnApiFailure('locationAPI.friendsLocations', err);
      return { success: false, locations: [] };
    }
  },
  async myState(): Promise<{
    success: boolean;
    sharing: boolean;
    lat: number | null;
    lng: number | null;
    updated_at: string | null;
    share_until: string | null;
  }> {
    try {
      const uid = auth.currentUser?.uid;
      if (!uid) {
        return { success: false, sharing: false, lat: null, lng: null, updated_at: null, share_until: null };
      }
      return await getMyLocationState(uid);
    } catch (err) {
      warnApiFailure('locationAPI.myState', err);
      return { success: false, sharing: false, lat: null, lng: null, updated_at: null, share_until: null };
    }
  },
  async history(
    options: LocationHistoryQuery | number = {},
  ): Promise<{ success: boolean; locations: LocationHistoryEntry[] }> {
    try {
      const uid = auth.currentUser?.uid;
      if (!uid) return { success: false, locations: [] };
      const locations = await listMyLocationHistory(uid, options);
      return { success: true, locations };
    } catch (err) {
      warnApiFailure('locationAPI.history', err);
      return { success: false, locations: [] };
    }
  },
};

/** Emergency contacts (Firestore). */
export const emergencyAPI = {
  async list(): Promise<{ success: boolean; contacts: EmergencyContact[] }> {
    try {
      const uid = auth.currentUser?.uid;
      if (!uid) return { success: false, contacts: [] };
      const contacts = await listEmergencyContacts(uid);
      return { success: true, contacts };
    } catch (err) {
      console.warn('[emergencyAPI] list failed:', err);
      return { success: false, contacts: [] };
    }
  },
  async add(name: string, phone: string): Promise<{ success: boolean }> {
    try {
      const uid = auth.currentUser?.uid;
      if (!uid) return { success: false };
      await addEmergencyContact(uid, name, phone);
      return { success: true };
    } catch (err) {
      console.warn('[emergencyAPI] add failed:', err);
      return { success: false };
    }
  },
  async remove(id: string | number): Promise<{ success: boolean }> {
    try {
      const uid = auth.currentUser?.uid;
      if (!uid) return { success: false };
      await removeEmergencyContact(uid, String(id));
      return { success: true };
    } catch (err) {
      console.warn('[emergencyAPI] remove failed:', err);
      return { success: false };
    }
  },
};
