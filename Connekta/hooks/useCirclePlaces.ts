import { useCallback, useEffect, useState } from 'react';
import { placesAPI, type SavedPlace } from '@/services/api';

export function useCirclePlaces(authToken: string | null) {
  const [places, setPlaces] = useState<SavedPlace[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!authToken) {
      setPlaces([]);
      setLoading(false);
      return;
    }
    try {
      const res = await placesAPI.circle();
      if (res.success) setPlaces(res.places);
    } catch {
      /* offline */
    } finally {
      setLoading(false);
    }
  }, [authToken]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { places, loading, refresh };
}
