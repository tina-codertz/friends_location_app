/**
 * Frontend API Service - Axios client for backend communication
 */

import axios, { AxiosError } from 'axios';
import * as SecureStore from 'expo-secure-store';
import {
  getApiAuthToken,
  notifyUnauthorized,
  setApiAuthToken,
  setApiUnauthorizedHandler,
} from '@/services/auth-token';

export { setApiAuthToken, setApiUnauthorizedHandler };

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

    if (isGatewayOutage) {
      console.warn(
        '[API] Gateway/backend unavailable for',
        url,
        '— ensure `npx wrangler dev` is running and ngrok points to port 8787'
      );
    } else {
      console.error('[API] Response error:', errorInfo);
    }

    if (!error.response) {
      console.warn('[API] Network error — no response. API URL:', API_BASE_URL);
    }
    
    if (error.response?.status === 401) {
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

export interface VerifyOTPRequest {
  email: string;
  code: string;
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
    const response = await apiClient.get<{ success: boolean; available: boolean; message?: string }>(
      '/auth/check-username',
      { params: { username: username.trim() } }
    );
    return response.data;
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
   * Verify OTP (returns session token when successful)
   */
  async verifyOTP(email: string, code: string): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/verify-otp', {
      email,
      code,
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

export interface FriendUser {
  id: number;
  username: string;
}

export interface FriendLocation extends FriendUser {
  lat: number;
  lng: number;
  updated_at: string;
}

export const friendsAPI = {
  async search(q: string): Promise<{ success: boolean; users: FriendUser[] }> {
    const res = await apiClient.get('/friends/search', { params: { q } });
    return res.data;
  },
  async sendRequest(to_user_id: number): Promise<{ success: boolean; message?: string }> {
    const res = await apiClient.post('/friends/request', { to_user_id });
    return res.data;
  },
  async accept(from_user_id: number): Promise<{ success: boolean; message?: string }> {
    const res = await apiClient.post('/friends/accept', { from_user_id });
    return res.data;
  },
  async reject(from_user_id: number): Promise<{ success: boolean; message?: string }> {
    const res = await apiClient.post('/friends/reject', { from_user_id });
    return res.data;
  },
  async list(): Promise<{ success: boolean; friends: FriendUser[] }> {
    const res = await apiClient.get('/friends');
    return res.data;
  },
  async remove(friendId: number): Promise<{ success: boolean; message?: string }> {
    const res = await apiClient.delete(`/friends/${friendId}`);
    return res.data;
  },
  async incoming(): Promise<{ success: boolean; incoming: FriendUser[] }> {
    const res = await apiClient.get('/friends/incoming');
    return res.data;
  },
  async getInvite(): Promise<{
    success: boolean;
    invite: { code: string; expires_at: string | null; created_at: string } | null;
  }> {
    const res = await apiClient.get('/friends/invite');
    return res.data;
  },
  async generateInvite(): Promise<{ success: boolean; code?: string; expires_at?: string; message?: string }> {
    const res = await apiClient.post('/friends/invite/generate');
    return res.data;
  },
  async joinWithCode(code: string): Promise<{
    success: boolean;
    message?: string;
    circle_owner?: FriendUser;
  }> {
    const res = await apiClient.post('/friends/invite/join', { code: code.trim().toUpperCase() });
    return res.data;
  },
};

export interface SavedPlace {
  id: number;
  user_id: number;
  username: string;
  name: string;
  lat: number;
  lng: number;
  created_at: string;
}

export const placesAPI = {
  async mine(): Promise<{ success: boolean; places: SavedPlace[] }> {
    const res = await apiClient.get('/places/mine');
    return res.data;
  },
  async circle(): Promise<{ success: boolean; places: SavedPlace[] }> {
    const res = await apiClient.get('/places/circle');
    return res.data;
  },
  async create(name: string, lat: number, lng: number): Promise<{ success: boolean; place?: SavedPlace; message?: string }> {
    const res = await apiClient.post('/places', { name, lat, lng });
    return res.data;
  },
  async remove(id: number): Promise<{ success: boolean; message?: string }> {
    const res = await apiClient.delete(`/places/${id}`);
    return res.data;
  },
};

export const locationAPI = {
  async setSharing(enabled: boolean): Promise<{ success: boolean; sharing: boolean }> {
    const res = await apiClient.post('/location/sharing', { enabled });
    return res.data;
  },
  async ping(lat: number, lng: number): Promise<{ success: boolean; message?: string }> {
    const res = await apiClient.post('/location/ping', { lat, lng });
    return res.data;
  },
  async friendsLocations(): Promise<{ success: boolean; locations: FriendLocation[] }> {
    const res = await apiClient.get('/location/friends');
    return res.data;
  },
  async myState(): Promise<{
    success: boolean;
    sharing: boolean;
    lat: number | null;
    lng: number | null;
    updated_at: string | null;
  }> {
    const res = await apiClient.get('/location/me');
    return res.data;
  },
};

/** Matches emergency_contacts table (no status column). */
export interface EmergencyContact {
  id: number;
  name: string;
  phone: string;
  sort_order: number;
}

export const emergencyAPI = {
  async list(): Promise<{ success: boolean; contacts: EmergencyContact[] }> {
    const res = await apiClient.get('/emergency');
    return res.data;
  },
  async add(name: string, phone: string): Promise<{ success: boolean }> {
    const res = await apiClient.post('/emergency', { name, phone });
    return res.data;
  },
  async remove(id: number): Promise<{ success: boolean }> {
    const res = await apiClient.delete(`/emergency/${id}`);
    return res.data;
  },
};

export default apiClient;
