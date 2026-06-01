import { useCallback, useEffect, useRef, useState } from 'react';
import { listCirclePlaces } from '@/firebase/firestore/places';
import type { SavedPlace } from '@/types/places';

const MIN_FETCH_MS = 20000;

export function useCirclePlaces(active: boolean, uid: string | null | undefined) {
  const [places, setPlaces] = useState<SavedPlace[]>([]);
  const [loading, setLoading] = useState(false);
  const mountedRef = useRef(true);
  const lastFetchRef = useRef(0);

  const refresh = useCallback(
    async (force = false) => {
      if (!active || !uid || !mountedRef.current) {
        if (mountedRef.current) {
          setPlaces([]);
          setLoading(false);
        }
        return;
      }

      const now = Date.now();
      if (!force && now - lastFetchRef.current < MIN_FETCH_MS) return;

      setLoading(true);
      try {
        const rows = await listCirclePlaces(uid);
        lastFetchRef.current = Date.now();
        if (!mountedRef.current) return;
        setPlaces(rows);
      } catch {
        /* offline */
      } finally {
        if (mountedRef.current) setLoading(false);
      }
    },
    [active, uid],
  );

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    void refresh(true);
  }, [refresh]);

  return { places, loading, refresh: () => refresh(true) };
};
