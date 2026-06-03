import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { locationAPI } from '@/services/api';
import type { FriendLocation } from '@/types/location';

const POLL_MS = 30_000;

function normalizeLocations(raw: unknown): FriendLocation[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter(
    (l): l is FriendLocation =>
      !!l &&
      typeof l.id === 'string' &&
      typeof l.lat === 'number' &&
      typeof l.lng === 'number' &&
      typeof l.username === 'string',
  );
}

/** Polls Firestore for circle members' shared locations while `active`. */
export function useFriendLocations(active: boolean, uid: string | null | undefined) {
  const [locations, setLocations] = useState<FriendLocation[]>([]);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mountedRef = useRef(true);
  const appState = useRef(AppState.currentState);

  const fetchOnce = useCallback(async () => {
    if (!active || !uid || !mountedRef.current) return;
    try {
      const res = await locationAPI.friendsLocations();
      if (!mountedRef.current) return;
      if (res.success) setLocations(normalizeLocations(res.locations));
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
    if (!active || !uid) return;

    const sub = AppState.addEventListener('change', (next: AppStateStatus) => {
      const prev = appState.current;
      appState.current = next;
      if (prev.match(/inactive|background/) && next === 'active') {
        void fetchOnce();
      }
    });
    return () => sub.remove();
  }, [active, uid, fetchOnce]);

  return { locations, refresh: fetchOnce };
}
