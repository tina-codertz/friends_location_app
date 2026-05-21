import { useCallback, useEffect, useRef, useState } from 'react';
import { placesAPI, type SavedPlace } from '@/services/api';

const MIN_FETCH_MS = 20000;

export function useCirclePlaces(active: boolean, authToken: string | null) {
  const [places, setPlaces] = useState<SavedPlace[]>([]);
  const [loading, setLoading] = useState(false);
  const mountedRef = useRef(true);
  const lastFetchRef = useRef(0);

  const refresh = useCallback(
    async (force = false) => {
      if (!active || !authToken || !mountedRef.current) {
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
        const res = await placesAPI.circle();
        lastFetchRef.current = Date.now();
        if (!mountedRef.current) return;
        if (res.success && Array.isArray(res.places)) {
          setPlaces(res.places);
        }
      } catch {
        /* offline */
      } finally {
        if (mountedRef.current) setLoading(false);
      }
    },
    [active, authToken]
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
