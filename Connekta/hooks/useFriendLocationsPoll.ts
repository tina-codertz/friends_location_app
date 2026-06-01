import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { locationAPI } from '@/services/api';
import type { FriendLocation } from '@/types/location';

const POLL_MS = 30000;

/** REST-only friend locations — polls Firestore via locationAPI. */
export function useFriendLocationsPoll(active: boolean, uid: string | null | undefined) {
  const [locations, setLocations] = useState<FriendLocation[]>([]);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mountedRef = useRef(true);

  const fetchOnce = useCallback(async () => {
    if (!active || !uid || !mountedRef.current) return;
    try {
      const res = await locationAPI.friendsLocations();
      if (!mountedRef.current) return;
      if (res.success && Array.isArray(res.locations)) {
        setLocations(
          res.locations.filter(
            (l) =>
              l &&
              typeof l.id === 'string' &&
              typeof l.lat === 'number' &&
              typeof l.lng === 'number' &&
              typeof l.username === 'string',
          ),
        );
      }
    } catch {
      /* offline */
    }
  }, [active, uid]);

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

    if (!active || !uid) {
      setLocations([]);
      return;
    }

    void fetchOnce();
    pollRef.current = setInterval(() => void fetchOnce(), POLL_MS);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      pollRef.current = null;
    };
  }, [active, uid, fetchOnce]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (next: AppStateStatus) => {
      if (next === 'active' && active && uid) void fetchOnce();
    });
    return () => sub.remove();
  }, [active, uid, fetchOnce]);

  return { locations, refresh: fetchOnce };
}
