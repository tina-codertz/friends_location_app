import { useCallback, useEffect, useRef, useState } from 'react';
import { placesAPI, type SavedPlace } from '@/services/api';

export function useCirclePlaces(active: boolean, authToken: string | null) {
  const [places, setPlaces] = useState<SavedPlace[]>([]);
  const [loading, setLoading] = useState(false);
  const mountedRef = useRef(true);

  const refresh = useCallback(async () => {
    if (!active || !authToken || !mountedRef.current) {
      if (mountedRef.current) {
        setPlaces([]);
        setLoading(false);
      }
      return;
    }
    setLoading(true);
    try {
      const res = await placesAPI.circle();
      if (!mountedRef.current) return;
      if (res.success && Array.isArray(res.places)) {
        setPlaces(res.places);
      }
    } catch {
      /* offline */
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [active, authToken]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { places, loading, refresh };
}
