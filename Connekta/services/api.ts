/**
 * Frontend API Service - Axios client for backend communication
 */

import axios, { AxiosError } from 'axios';
import * as SecureStore from 'expo-secure-store';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8787';

// Create axios instance
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Add JWT token from secure storage
apiClient.interceptors.request.use(
  async (config) => {
    const token = await SecureStore.getItemAsync('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - Handle errors
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<any>) => {
    if (error.response?.status === 401) {
      // Unauthorized - clear token from secure storage
      SecureStore.deleteItemAsync('auth_token');
      SecureStore.deleteItemAsync('user_data');
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
