import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { FriendLocation, locationAPI } from '@/services/api';

const POLL_MS = 30000;

/**
 * REST-only friend locations — no WebSocket. Polls only when active + authenticated.
 */
export function useFriendLocationsPoll(active: boolean, authToken: string | null) {
  const [locations, setLocations] = useState<FriendLocation[]>([]);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mountedRef = useRef(true);

  const fetchOnce = useCallback(async () => {
    if (!active || !authToken || !mountedRef.current) return;
    try {
      const res = await locationAPI.friendsLocations();
      if (!mountedRef.current) return;
      if (res.success && Array.isArray(res.locations)) {
        setLocations(
          res.locations.filter(
            (l) =>
              l &&
              typeof l.id === 'number' &&
              typeof l.lat === 'number' &&
              typeof l.lng === 'number' &&
              typeof l.username === 'string'
          )
        );
      }
    } catch {
      /* offline */
    }
  }, [active, authToken]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }

    if (!active || !authToken) {
      setLocations([]);
      return;
    }

    void fetchOnce();
    pollRef.current = setInterval(() => void fetchOnce(), POLL_MS);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      pollRef.current = null;
    };
  }, [active, authToken, fetchOnce]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (next: AppStateStatus) => {
      if (next === 'active' && active && authToken) void fetchOnce();
    });
    return () => sub.remove();
  }, [active, authToken, fetchOnce]);

  return { locations, refresh: fetchOnce };
}
