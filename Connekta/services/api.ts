/**
 * Frontend API Service - Axios client for backend communication
 */

import axios, { AxiosError } from 'axios';
import * as SecureStore from 'expo-secure-store';
import {
  getApiAuthToken,
  getLegacyApiLogoutOn401,
  notifyUnauthorized,
  setApiAuthToken,
  setApiUnauthorizedHandler,
} from '@/services/auth-token';
import { auth, firebaseAuthErrorMessage, isAuthQuotaExceeded, loadAppUser } from '@/connekta-firebase';
import {
  createPlace,
  deletePlace,
  listCirclePlaces,
  listMyPlaces,
} from '@/connekta-firebase/firestore/places';
import {
  getMyLocationState,
  listFriendLocations,
  pingLocation,
  setLocationSharing,
} from '@/connekta-firebase/firestore/location';
import * as firestoreCircle from '@/connekta-firebase/firestore/circle';
import {
  addEmergencyContact,
  listEmergencyContacts,
  removeEmergencyContact,
} from '@/connekta-firebase/firestore/emergency';

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

export { setApiAuthToken, setApiUnauthorizedHandler };
import type { PlaceKind, SavedPlace } from '@/types/places';

export type { SavedPlace };

// Get API base URL - use machine IP if running on device
const getAPIBaseURL = (): string => {
  const envUrl = process.env.EXPO_PUBLIC_API_URL?.trim();
  if (envUrl) {
    return envUrl.replace(/\/$/, '');
  }
  return 'https://backend.christinakimario8.workers.dev';
};

const API_BASE_URL = getAPIBaseURL();
console.log('[API] Using base URL:', API_BASE_URL);

/** WebSocket URL for Durable Object realtime hub (JWT as query param). */
export function getRealtimeWebSocketUrl(token: string): string {
  const override = process.env.EXPO_PUBLIC_WS_URL;
  if (override) {
    const u = new URL(override);
    u.searchParams.set('token', token);
    return u.toString();
  }
  const wsBase = getAPIBaseURL().replace(/^https:\/\//i, 'wss://').replace(/^http:\/\//i, 'ws://');
  return `${wsBase.replace(/\/$/, '')}/realtime/ws?token=${encodeURIComponent(token)}`;
}

// Create axios instance
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true',
  },
});

// Request interceptor - Add JWT token from secure storage
apiClient.interceptors.request.use(
  async (config) => {
    try {
      let token = getApiAuthToken();
      if (!token) {
        token = await SecureStore.getItemAsync('auth_token');
      }
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (err) {
      console.warn('[API] Failed to get token:', err);
    }
    console.log('[API] Making request:', config.method?.toUpperCase(), config.url);
    return config;
  },
  (error) => {
    console.error('[API] Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor - Handle errors
apiClient.interceptors.response.use(
  (response) => {
    console.log('[API] Response received:', response.status, response.config.url);
    return response;
  },
  async (error: AxiosError<any>) => {
    const status = error.response?.status;
    const url = error.config?.url ?? '';
    const rawData = error.response?.data;
    const isHtmlGateway =
      typeof rawData === 'string' &&
      (rawData.includes('ngrok') || rawData.includes('<!DOCTYPE html>'));
    const isGatewayOutage = status === 502 || status === 503 || status === 504 || isHtmlGateway;

    const errorInfo = {
      status,
      message: error.message,
      url,
      data: isHtmlGateway ? '(ngrok/gateway HTML — backend unreachable)' : rawData,
      code: error.code,
    };

    const isLegacyFirebaseCall =
      typeof url === 'string' &&
      (url.includes('/places') ||
        url.includes('/location') ||
        url.includes('/friends') ||
        url.includes('/emergency'));
    if (isGatewayOutage) {
      console.warn(
        '[API] Gateway/backend unavailable for',
        url,
        '— ensure `npx wrangler dev` is running and ngrok points to port 8787'
      );
    } else if (isLegacyFirebaseCall) {
      console.warn('[API] Deprecated HTTP call (use Firestore):', url);
    } else {
      console.error('[API] Response error:', errorInfo);
    }

    if (!error.response) {
      console.warn('[API] Network error — no response. API URL:', API_BASE_URL);
    }
    
    if (error.response?.status === 401 && getLegacyApiLogoutOn401()) {
      setApiAuthToken(null);
      try {
        await SecureStore.deleteItemAsync('auth_token');
        await SecureStore.deleteItemAsync('user_data');
      } catch (err) {
        console.warn('[API] Failed to clear secure store:', err);
      }
      notifyUnauthorized();
    }
    return Promise.reject(error);
  }
);

/** Prefer server message from axios 4xx/5xx responses. */
export function getApiErrorMessage(err: unknown, fallback: string): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as { message?: unknown } | undefined;
    if (typeof data?.message === 'string' && data.message.trim().length > 0) {
      return data.message;
    }
  }
  if (err instanceof Error && err.message) return err.message;
  return fallback;
}

export interface RegisterRequest {
  email: string;
  username: string;
  device_id: string;
}

export interface LoginRequest {
  username: string;
  device_id: string;
}

export interface User {
  id: number;
  email: string;
  username: string;
  device_id: string;
  verified: number;
  created_at: string;
}

export interface AuthResponse {
  success: boolean;
  user?: User;
  token?: string;
  message?: string;
}

/**
 * Auth API endpoints
 */
export const authAPI = {
  /** Check if username is free before sign-up. */
  async checkUsername(username: string): Promise<{ success: boolean; available: boolean; message?: string }> {
    try {
      const response = await apiClient.get<{ success: boolean; available: boolean; message?: string }>(
        '/auth/check-username',
        { params: { username: username.trim() } }
      );
      return response.data;
    } catch (err) {
      // Older deployed workers may not have this route yet; register still validates username.
      if (axios.isAxiosError(err) && err.response?.status === 404) {
        console.warn('[API] /auth/check-username not deployed — skipping pre-check');
        return { success: true, available: true };
      }
      throw err;
    }
  },

  /**
   * Register new user
   */
  async register(email: string, username: string, device_id: string): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/register', {
      email,
      username,
      device_id,
    });
    return response.data;
  },

  /**
   * Login user
   */
  async login(username: string, device_id: string): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/login', {
      username,
      device_id,
    });
    return response.data;
  },
};

export type { FriendUser } from '@/types/friends';
import type { FriendUser } from '@/types/friends';

export type { FriendLocation } from '@/types/location';
import type { FriendLocation } from '@/types/location';

/** Friends & circle invites use Firestore (not Cloudflare /friends API). */
export const friendsAPI = {
  async search(q: string): Promise<{ success: boolean; users: FriendUser[] }> {
    try {
      const uid = auth.currentUser?.uid;
      if (!uid) return { success: false, users: [] };
      const users = await firestoreCircle.searchUsers(uid, q);
      return { success: true, users };
    } catch (err) {
      console.warn('[friendsAPI] search failed:', err);
      return { success: false, users: [] };
    }
  },
  async sendRequest(to_user_id: string): Promise<{ success: boolean; message?: string }> {
    try {
      const uid = auth.currentUser?.uid;
      if (!uid) return { success: false, message: 'Not signed in' };
      return await firestoreCircle.sendFriendRequest(uid, to_user_id);
    } catch (err) {
      console.warn('[friendsAPI] sendRequest failed:', err);
      return { success: false, message: 'Could not send request' };
    }
  },
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

/** Places use Firestore (not the Cloudflare /places API). */
export const placesAPI = {
  async mine(): Promise<{ success: boolean; places: SavedPlace[] }> {
    try {
      const uid = auth.currentUser?.uid;
      if (!uid) return { success: false, places: [] };
      const places = await listMyPlaces(uid);
      return { success: true, places };
    } catch (err) {
      console.warn('[placesAPI] mine failed:', err);
      return { success: false, places: [] };
    }
  },
  async circle(): Promise<{ success: boolean; places: SavedPlace[] }> {
    try {
      const uid = auth.currentUser?.uid;
      if (!uid) return { success: false, places: [] };
      const places = await listCirclePlaces(uid);
      return { success: true, places };
    } catch (err) {
      console.warn('[placesAPI] circle failed:', err);
      return { success: false, places: [] };
    }
  },
  async create(
    name: string,
    lat: number,
    lng: number,
    kind?: PlaceKind,
  ): Promise<{ success: boolean; place?: SavedPlace; message?: string }> {
    try {
      const fbUser = auth.currentUser;
      if (!fbUser) return { success: false, message: 'Not signed in' };
      const profile = await loadAppUser(fbUser);
      const place = await createPlace(
        fbUser.uid,
        profile?.username ?? 'user',
        name,
        lat,
        lng,
        kind,
      );
      return { success: true, place };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Could not save place';
      return { success: false, message };
    }
  },
  async remove(id: string | number): Promise<{ success: boolean; message?: string }> {
    try {
      const uid = auth.currentUser?.uid;
      if (!uid) return { success: false, message: 'Not signed in' };
      await deletePlace(String(id), uid);
      return { success: true };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Could not delete place';
      return { success: false, message };
    }
  },
};

/** Location sharing uses Firestore `users/{uid}` (not Cloudflare /location API). */
export const locationAPI = {
  async setSharing(enabled: boolean): Promise<{ success: boolean; sharing: boolean }> {
    try {
      const uid = auth.currentUser?.uid;
      if (!uid) return { success: false, sharing: false };
      return await setLocationSharing(uid, enabled);
    } catch (err) {
      warnApiFailure('locationAPI.setSharing', err);
      return { success: false, sharing: !enabled };
    }
  },
  async ping(lat: number, lng: number): Promise<{ success: boolean; message?: string }> {
    try {
      const uid = auth.currentUser?.uid;
      if (!uid) return { success: false, message: 'Not signed in' };
      return await pingLocation(uid, lat, lng);
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
  }> {
    try {
      const uid = auth.currentUser?.uid;
      if (!uid) {
        return { success: false, sharing: false, lat: null, lng: null, updated_at: null };
      }
      return await getMyLocationState(uid);
    } catch (err) {
      warnApiFailure('locationAPI.myState', err);
      return { success: false, sharing: false, lat: null, lng: null, updated_at: null };
    }
  },
};

export type { EmergencyContact } from '@/types/emergency';
import type { EmergencyContact } from '@/types/emergency';

/** Emergency contacts use Firestore (not Cloudflare /emergency API). */
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

export default apiClient;
