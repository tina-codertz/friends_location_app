/**
 * Authentication Context - JWT Token & User State Management
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import * as Device from 'expo-device';
import { authAPI, User } from '@/services/api';

export interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isLoggedIn: boolean;
  error: string | null;
  
  // Auth methods
  register: (email: string, username: string) => Promise<void>;
  verifyOTP: (email: string, code: string) => Promise<void>;
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
      let deviceId = await AsyncStorage.getItem('device_id');
      if (!deviceId) {
        deviceId = Device.deviceId || `device-${Date.now()}`;
        await AsyncStorage.setItem('device_id', deviceId);
      }
      return deviceId;
    } catch (err) {
      console.error('Failed to get device ID:', err);
      return `device-${Date.now()}`;
    }
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
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
        }
      } catch (err) {
        console.error('Failed to restore token:', err);
      } finally {
        setIsLoading(false);
      }
    };

    restoreToken();
  }, []);

  // Register with email and username
  const register = useCallback(
    async (email: string, username: string) => {
      setIsLoading(true);
      setError(null);
      try {
        const deviceId = await getDeviceId();
        const response = await authAPI.register(email, username, deviceId);

        if (!response.success) {
          throw new Error(response.message || 'Registration failed');
        }

        // Store email temporarily for OTP verification
        await AsyncStorage.setItem('temp_email', email);
      } catch (err: any) {
        const errorMsg = err.message || 'Registration failed';
        setError(errorMsg);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [getDeviceId]
  );

  // Verify OTP
  const verifyOTP = useCallback(async (email: string, code: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await authAPI.verifyOTP(email, code);

      if (!response.success) {
        throw new Error(response.message || 'OTP verification failed');
      }

      // Clear temp email
      await AsyncStorage.removeItem('temp_email');
    } catch (err: any) {
      const errorMsg = err.message || 'OTP verification failed';
      setError(errorMsg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

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

        setToken(response.token);
        setUser(response.user);
      } catch (err: any) {
        const errorMsg = err.message || 'Login failed';
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
        SecureStore.deleteItemAsync('auth_token'),
        SecureStore.deleteItemAsync('user_data'),
        AsyncStorage.removeItem('temp_email'),
      ]);
      setToken(null);
      setUser(null);
      setError(null);
    } catch (err) {
      console.error('Logout error:', err);
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
    isLoggedIn: !!token && !!user,
    error,
    register,
    verifyOTP,
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
