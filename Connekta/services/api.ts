/**
 * Frontend API Service - Axios client for backend communication
 */

import axios, { AxiosError } from 'axios';
import * as SecureStore from 'expo-secure-store';

// Get API base URL - use machine IP if running on device
const getAPIBaseURL = (): string => {
  const envUrl = process.env.EXPO_PUBLIC_API_URL;
  if (envUrl) {
    return envUrl;
  }
  // Fallback for development
  return 'http://192.168.1.16:8789';
};

const API_BASE_URL = getAPIBaseURL();
console.log('[API] Using base URL:', API_BASE_URL);

// Create axios instance
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000, // Increased timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Add JWT token from secure storage
apiClient.interceptors.request.use(
  async (config) => {
    try {
      const token = await SecureStore.getItemAsync('auth_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (err) {
      console.warn('[API] Failed to get token from secure store:', err);
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
  (error: AxiosError<any>) => {
    console.error('[API] Response error:', {
      status: error.response?.status,
      message: error.message,
      url: error.config?.url,
      data: error.response?.data,
    });
    
    if (error.response?.status === 401) {
      // Unauthorized - clear token from secure storage
      try {
        SecureStore.deleteItemAsync('auth_token');
        SecureStore.deleteItemAsync('user_data');
      } catch (err) {
        console.warn('[API] Failed to clear secure store:', err);
      }
    }
    return Promise.reject(error);
  }
);

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
   * Verify OTP
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

export default apiClient;
