import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { FriendLocation, locationAPI } from '@/services/api';

const POLL_MS = 7000;

export function useLiveFriendLocations(enabled: boolean) {
  const [locations, setLocations] = useState<FriendLocation[]>([]);
  const [error, setError] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const appState = useRef(AppState.currentState);

  const fetchOnce = useCallback(async () => {
    if (!enabled) return;
    try {
      const res = await locationAPI.friendsLocations();
      if (res.success) {
        setLocations(res.locations);
        setError(null);
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to refresh friends');
    }
  }, [enabled]);

  useEffect(() => {
    if (!enabled) {
      setLocations([]);
      return;
    }
    void fetchOnce();
    timer.current = setInterval(fetchOnce, POLL_MS);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [enabled, fetchOnce]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (next: AppStateStatus) => {
      if (appState.current.match(/inactive|background/) && next === 'active' && enabled) {
        void fetchOnce();
      }
      appState.current = next;
    });
    return () => sub.remove();
  }, [enabled, fetchOnce]);

  return { locations, error, refresh: fetchOnce };
}
