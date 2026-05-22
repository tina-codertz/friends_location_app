/**
 * Authentication Context - JWT Token & User State Management
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { authAPI, getApiErrorMessage, User, setApiAuthToken, setApiUnauthorizedHandler } from '@/services/api';

export interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isLoggedIn: boolean;
  error: string | null;
  
  // Auth methods
  register: (email: string, username: string) => Promise<void>;
  login: (username: string) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get or create device ID
  const getDeviceId = useCallback(async (): Promise<string> => {
    try {
      // First: try to get from SecureStore (most reliable for persistence)
      let deviceId = await SecureStore.getItemAsync('device_id');
      if (deviceId) {
        console.log('[AUTH] Using device ID from SecureStore:', deviceId);
        return deviceId;
      }

      // Legacy: expo-device no longer exposes deviceId; prefer persisted SecureStore id.
      try {
        deviceId = await AsyncStorage.getItem('device_id');
        if (deviceId) {
          console.log('[AUTH] Using device ID from AsyncStorage:', deviceId);
          await SecureStore.setItemAsync('device_id', deviceId);
          return deviceId;
        }
      } catch (storageErr) {
        console.warn('[AUTH] AsyncStorage not available:', storageErr);
      }

      // Final: generate and persist new ID
      deviceId = `device-${Date.now()}`;
      console.log('[AUTH] Generated new device ID:', deviceId);
      await SecureStore.setItemAsync('device_id', deviceId);
      
      return deviceId;
    } catch (err) {
      console.error('[AUTH] Failed to get device ID:', err);
      return `device-${Date.now()}`;
    }
  }, []);

  // Keep API client token in sync with React state
  useEffect(() => {
    setApiAuthToken(token);
  }, [token]);

  useEffect(() => {
    setApiUnauthorizedHandler(() => {
      setToken(null);
      setUser(null);
    });
    return () => setApiUnauthorizedHandler(null);
  }, []);

  // Restore token on app launch
  useEffect(() => {
    const restoreToken = async () => {
      setIsLoading(true);
      try {
        const [storedToken, storedUser] = await Promise.all([
          SecureStore.getItemAsync('auth_token'),
          SecureStore.getItemAsync('user_data'),
        ]);

        if (storedToken && storedUser) {
          let parsed: User | null = null;
          try {
            const raw = JSON.parse(storedUser) as Partial<User>;
            if (
              raw &&
              typeof raw.id === 'number' &&
              typeof raw.username === 'string' &&
              typeof raw.email === 'string'
            ) {
              parsed = raw as User;
            }
          } catch {
            await SecureStore.deleteItemAsync('user_data').catch(() => undefined);
          }
          if (parsed) {
            setApiAuthToken(storedToken);
            setToken(storedToken);
            setUser(parsed);
          } else {
            await SecureStore.deleteItemAsync('auth_token').catch(() => undefined);
          }
        }
      } catch (err) {
        console.error('Failed to restore token:', err);
      } finally {
        setIsLoading(false);
      }
    };

    restoreToken();
  }, []);

  // Register with email and username (no email verification)
  const register = useCallback(
    async (email: string, username: string) => {
      setIsLoading(true);
      setError(null);
      try {
        const deviceId = await getDeviceId();
        const response = await authAPI.register(email, username, deviceId);

        if (!response.success || !response.token || !response.user) {
          throw new Error(response.message || 'Registration failed');
        }

        await Promise.all([
          SecureStore.setItemAsync('auth_token', response.token),
          SecureStore.setItemAsync('user_data', JSON.stringify(response.user)),
          SecureStore.setItemAsync('needs_biometric_enrollment', '1'),
        ]);
        setApiAuthToken(response.token);
        setToken(response.token);
        setUser(response.user);
      } catch (err: unknown) {
        const errorMsg = getApiErrorMessage(err, 'Registration failed');
        setError(errorMsg);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [getDeviceId]
  );

  // Login with username
  const login = useCallback(
    async (username: string) => {
      setIsLoading(true);
      setError(null);
      try {
        const deviceId = await getDeviceId();
        const response = await authAPI.login(username, deviceId);

        if (!response.success || !response.token || !response.user) {
          throw new Error(response.message || 'Login failed');
        }

        // Store token and user data securely
        await Promise.all([
          SecureStore.setItemAsync('auth_token', response.token),
          SecureStore.setItemAsync('user_data', JSON.stringify(response.user)),
        ]);

        setApiAuthToken(response.token);
        setToken(response.token);
        setUser(response.user);
      } catch (err: unknown) {
        const errorMsg = getApiErrorMessage(err, 'Login failed');
        setError(errorMsg);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [getDeviceId]
  );

  // Logout
  const logout = useCallback(async () => {
    try {
      await Promise.all([
        SecureStore.deleteItemAsync('auth_token').catch(err => console.warn('Failed to delete auth token:', err)),
        SecureStore.deleteItemAsync('user_data').catch(err => console.warn('Failed to delete user data:', err)),
        SecureStore.deleteItemAsync('needs_biometric_enrollment').catch(() => undefined),
        SecureStore.deleteItemAsync('biometric_unlock_enabled').catch(() => undefined),
      ]);
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setApiAuthToken(null);
      setToken(null);
      setUser(null);
      setError(null);
    }
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const value: AuthContextType = {
    user,
    token,
    isLoading,
    isLoggedIn: Boolean(token && user),
    error,
    register,
    login,
    logout,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within <AuthProvider>');
  }
  return context;
};
