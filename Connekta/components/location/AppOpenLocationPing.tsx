import React from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { useAuth } from '@/context/AuthContext';
import { useAppOpenLocationPing } from '@/hooks/useAppOpenLocationPing';
import { syncBackgroundLocationSharing } from '@/services/background-location';

/** Runs app-wide location ping when sharing is on (any tab). */
export function AppOpenLocationPing() {
  const { isLoggedIn, user } = useAuth();
  useAppOpenLocationPing(isLoggedIn, user?.uid ?? null);

  React.useEffect(() => {
    if (isLoggedIn) {
      void syncBackgroundLocationSharing();
    }
  }, [isLoggedIn, user?.uid]);

  React.useEffect(() => {
    if (!isLoggedIn) return;

    const appStateRef = { current: AppState.currentState };
    const sub = AppState.addEventListener('change', (next: AppStateStatus) => {
      const prev = appStateRef.current;
      appStateRef.current = next;
      if (prev.match(/inactive|background/) && next === 'active') {
        void syncBackgroundLocationSharing();
      }
    });
    return () => sub.remove();
  }, [isLoggedIn]);

  return null;
}
