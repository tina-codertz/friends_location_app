
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import {
  auth,
  clearAuthQuotaBackoff,
  firebaseAuthErrorMessage,
  firebaseLogout,
  loadAppUser,
  loginWithEmail,
  registerWithEmail,
  subscribeToAuthState,
} from '@/connekta-firebase';
import { setApiAuthToken } from '@/services/auth-token';
import { setLegacyApiLogoutOn401 } from '@/services/auth-token';
import {
  disableBiometricUnlock,
  scheduleBiometricEnrollmentIfNeeded,
} from '@/services/biometric-unlock';
import { markOnboardingComplete } from '@/services/onboarding';
import { clearSessionActivity, isSessionExpired, recordSessionActivity } from '@/services/session-activity';
import type { AppUser } from '@/types/user';

export type { AppUser };

export interface AuthContextType {
  user: AppUser | null;
  /** Firebase ID token for legacy Cloudflare API (map/friends) until full migration */
  token: string | null;
  isLoading: boolean;
  isLoggedIn: boolean;
  error: string | null;
  register: (email: string, password: string, username: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  /** Sign out after inactivity timeout; keeps biometric credentials for quick sign-in. */
  expireSession: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  useEffect(() => {
    setLegacyApiLogoutOn401(false);
  }, []);

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
      clearAuthQuotaBackoff();
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

      try {
        deviceId = await AsyncStorage.getItem('device_id');
        if (deviceId) {
          await SecureStore.setItemAsync('device_id', deviceId);
          return deviceId;
        }
      } catch {
        /* ignore */
      }

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
          if (await isSessionExpired()) {
            await clearSessionActivity();
            await firebaseLogout();
            setUser(null);
            setApiAuthToken(null);
            setToken(null);
            return;
          }
          const profile = await loadAppUser(fbUser);
          setUser(profile);
          if (profile) {
            await syncIdToken();
          } else {
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
        await recordSessionActivity();
        await markOnboardingComplete();
        await scheduleBiometricEnrollmentIfNeeded(email, password);
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
        await recordSessionActivity();
        await markOnboardingComplete();
        await scheduleBiometricEnrollmentIfNeeded(email, password);
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

  const expireSession = useCallback(async () => {
    try {
      await clearSessionActivity();
      await firebaseLogout();
    } catch (err) {
      console.error('Session expire error:', err);
    } finally {
      setApiAuthToken(null);
      setToken(null);
      setUser(null);
      setError(null);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await firebaseLogout();
      await disableBiometricUnlock();
      await clearSessionActivity();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setApiAuthToken(null);
      setToken(null);
      setUser(null);
      setError(null);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const value: AuthContextType = {
    user,
    token,
    isLoading,
    isLoggedIn: Boolean(user),
    error,
    register,
    login,
    logout,
    expireSession,
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
