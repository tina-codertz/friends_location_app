import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import {
  auth,
  firebaseAuthErrorMessage,
  firebaseLogout,
  loadAppUser,
  loginWithEmail,
  registerWithEmail,
  subscribeToAuthState,
  updateUsername,
} from '@/connekta-firebase';
import { setApiAuthToken } from '@/services/auth-token';
import { markOnboardingComplete } from '@/services/onboarding';
import type { AppUser } from '@/types/user';

export type { AppUser };

export interface AuthContextType {
  user: AppUser | null;
  token: string | null;
  isLoading: boolean;
  isLoggedIn: boolean;
  error: string | null;
  register: (email: string, password: string, username: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (username: string) => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const syncIdToken = useCallback(async () => {
    const fbUser = auth.currentUser;
    if (!fbUser) {
      setApiAuthToken(null);
      setToken(null);
      return;
    }
    try {
      const idToken = await fbUser.getIdToken();
      setApiAuthToken(idToken);
      setToken(idToken);
    } catch (err) {
      console.warn('[AUTH] Failed to refresh ID token:', err);
      setApiAuthToken(null);
      setToken(null);
    }
  }, []);

  const getDeviceId = useCallback(async (): Promise<string> => {
    try {
      let deviceId = await SecureStore.getItemAsync('device_id');
      if (deviceId) return deviceId;
      deviceId = `device-${Date.now()}`;
      await SecureStore.setItemAsync('device_id', deviceId);
      return deviceId;
    } catch {
      return `device-${Date.now()}`;
    }
  }, []);

  useEffect(() => {
    const unsub = subscribeToAuthState(async (fbUser) => {
      setIsLoading(true);
      try {
        if (fbUser) {
          const profile = await loadAppUser(fbUser);
          setUser(profile);
          if (profile) await syncIdToken();
          else {
            setApiAuthToken(null);
            setToken(null);
          }
        } else {
          setUser(null);
          setApiAuthToken(null);
          setToken(null);
        }
      } catch (err) {
        console.error('[AUTH] Session restore failed:', err);
        setUser(null);
        setApiAuthToken(null);
        setToken(null);
      } finally {
        setIsLoading(false);
      }
    });
    return unsub;
  }, [syncIdToken]);

  const register = useCallback(
    async (email: string, password: string, username: string) => {
      setIsLoading(true);
      setError(null);
      try {
        const deviceId = await getDeviceId();
        const profile = await registerWithEmail(email, password, username, deviceId);
        setUser(profile);
        await syncIdToken();
        await markOnboardingComplete();
      } catch (err: unknown) {
        const errorMsg = firebaseAuthErrorMessage(err);
        setError(errorMsg);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [getDeviceId, syncIdToken],
  );

  const login = useCallback(
    async (email: string, password: string) => {
      setIsLoading(true);
      setError(null);
      try {
        const profile = await loginWithEmail(email, password);
        setUser(profile);
        await syncIdToken();
        await markOnboardingComplete();
      } catch (err: unknown) {
        const errorMsg = firebaseAuthErrorMessage(err);
        setError(errorMsg);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [syncIdToken],
  );

  const logout = useCallback(async () => {
    try {
      await firebaseLogout();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setApiAuthToken(null);
      setToken(null);
      setUser(null);
      setError(null);
    }
  }, []);

  const updateProfile = useCallback(async (username: string) => {
    setError(null);
    try {
      const profile = await updateUsername(username);
      setUser(profile);
    } catch (err: unknown) {
      setError(firebaseAuthErrorMessage(err));
      throw err;
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isLoggedIn: Boolean(user),
        error,
        register,
        login,
        logout,
        updateProfile,
        clearError,
      }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within <AuthProvider>');
  return context;
}