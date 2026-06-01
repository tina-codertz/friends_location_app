import React, { useCallback, useEffect, useRef } from 'react';
import { View, AppState, type AppStateStatus, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { isSessionExpired, recordSessionActivity } from '@/services/session-activity';

type Props = {
  children: React.ReactNode;
};

const CHECK_INTERVAL_MS = 30_000;
const TOUCH_DEBOUNCE_MS = 5_000;

/**
 * Ends the Firebase session after 10 minutes of inactivity (background or no touch).
 * User must sign in again — with biometrics on the auth screen if they enrolled.
 */
export function SessionTimeoutGuard({ children }: Props) {
  const { isLoggedIn, expireSession } = useAuth();
  const router = useRouter();
  const appState = useRef(AppState.currentState);
  const expiring = useRef(false);
  const lastTouchRecord = useRef(0);

  const checkAndExpire = useCallback(async (): Promise<boolean> => {
    if (!isLoggedIn || expiring.current) return false;
    if (!(await isSessionExpired())) return false;

    expiring.current = true;
    try {
      await expireSession();
      router.replace('/auth/AuthScreen');
      return true;
    } finally {
      expiring.current = false;
    }
  }, [isLoggedIn, expireSession, router]);

  const touchActivity = useCallback(() => {
    const now = Date.now();
    if (now - lastTouchRecord.current < TOUCH_DEBOUNCE_MS) return;
    lastTouchRecord.current = now;
    void recordSessionActivity();
  }, []);

  useEffect(() => {
    if (!isLoggedIn) return;

    void (async () => {
      const expired = await checkAndExpire();
      if (!expired) {
        await recordSessionActivity();
      }
    })();
  }, [isLoggedIn, checkAndExpire]);

  useEffect(() => {
    if (!isLoggedIn) return;

    const sub = AppState.addEventListener('change', (next: AppStateStatus) => {
      const prev = appState.current;
      appState.current = next;

      if (prev.match(/inactive|background/) && next === 'active') {
        void (async () => {
          const expired = await checkAndExpire();
          if (!expired) {
            await recordSessionActivity();
          }
        })();
      }

      if (next.match(/inactive|background/) && prev === 'active') {
        void recordSessionActivity();
      }
    });

    return () => sub.remove();
  }, [isLoggedIn, checkAndExpire]);

  useEffect(() => {
    if (!isLoggedIn) return;
    const id = setInterval(() => {
      void checkAndExpire();
    }, CHECK_INTERVAL_MS);
    return () => clearInterval(id);
  }, [isLoggedIn, checkAndExpire]);

  return (
    <View
      style={styles.fill}
      onStartShouldSetResponder={() => {
        touchActivity();
        return false;
      }}
      onMoveShouldSetResponder={() => {
        touchActivity();
        return false;
      }}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
});
