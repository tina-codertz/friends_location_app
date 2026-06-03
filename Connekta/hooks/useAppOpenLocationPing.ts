import { useCallback, useEffect, useRef } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import * as Location from 'expo-location';
import { ENABLE_APP_OPEN_LOCATION_PING } from '@/constants/features';
import { locationAPI } from '@/services/api';
import { canSendLocationPing, markLocationPingSent } from '@/utils/location-ping-coalesce';

/**
 * Pings Firestore when the user opens the app or returns to foreground,
 * if live sharing is enabled. Complements Map-tab GPS watch.
 */
export function useAppOpenLocationPing(active: boolean, uid: string | null | undefined) {
  const appStateRef = useRef(AppState.currentState);
  const inFlightRef = useRef(false);

  const pingIfSharing = useCallback(async () => {
    if (!ENABLE_APP_OPEN_LOCATION_PING || !active || !uid || inFlightRef.current) return;
    if (!canSendLocationPing()) return;

    inFlightRef.current = true;
    try {
      const state = await locationAPI.myState();
      if (!state.success || !state.sharing) return;

      const { status } = await Location.getForegroundPermissionsAsync();
      if (status !== 'granted') return;

      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const res = await locationAPI.ping(pos.coords.latitude, pos.coords.longitude);
      if (res.success) markLocationPingSent();
    } catch {
      /* offline or permission */
    } finally {
      inFlightRef.current = false;
    }
  }, [active, uid]);

  useEffect(() => {
    if (!active || !uid) return;
    void pingIfSharing();
  }, [active, uid, pingIfSharing]);

  useEffect(() => {
    if (!active || !uid) return;

    const sub = AppState.addEventListener('change', (next: AppStateStatus) => {
      const prev = appStateRef.current;
      appStateRef.current = next;
      if (prev.match(/inactive|background/) && next === 'active') {
        void pingIfSharing();
      }
    });
    return () => sub.remove();
  }, [active, uid, pingIfSharing]);
}
