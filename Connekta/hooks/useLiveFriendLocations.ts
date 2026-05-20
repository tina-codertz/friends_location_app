import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { ENABLE_REALTIME } from '@/constants/features';
import { FriendLocation, getRealtimeWebSocketUrl, locationAPI } from '@/services/api';

const POLL_MS = 30000;
const MAX_WS_RECONNECT = 5;

type WsPayload = {
  event: string;
  data: unknown;
};

function isLocationPayload(d: unknown): d is FriendLocation {
  if (!d || typeof d !== 'object') return false;
  const o = d as Record<string, unknown>;
  return (
    typeof o.id === 'number' &&
    typeof o.username === 'string' &&
    typeof o.lat === 'number' &&
    typeof o.lng === 'number' &&
    typeof o.updated_at === 'string'
  );
}

/**
 * Live friend locations. WebSocket is OFF unless EXPO_PUBLIC_ENABLE_REALTIME=true.
 * Use useFriendLocationsPoll for the Friends tab (safer on Android APK).
 */
export function useLiveFriendLocations(active: boolean, authToken: string | null) {
  const [locations, setLocations] = useState<FriendLocation[]>([]);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const attemptRef = useRef(0);
  const mountedRef = useRef(true);
  const appState = useRef(AppState.currentState);

  const fetchOnce = useCallback(async () => {
    if (!active || !authToken || !mountedRef.current) return;
    try {
      const res = await locationAPI.friendsLocations();
      if (!mountedRef.current) return;
      if (res.success && Array.isArray(res.locations)) {
        setLocations(res.locations.filter((l) => l && typeof l.lat === 'number'));
      }
    } catch {
      /* offline */
    }
  }, [active, authToken]);

  const applyWsMessage = useCallback((raw: string) => {
    if (!mountedRef.current) return;
    let msg: WsPayload;
    try {
      msg = JSON.parse(raw) as WsPayload;
    } catch {
      return;
    }
    if (msg.event === 'location_update' && isLocationPayload(msg.data)) {
      const next = msg.data;
      setLocations((prev) => {
        const i = prev.findIndex((p) => p.id === next.id);
        if (i === -1) return [...prev, next];
        const copy = [...prev];
        copy[i] = next;
        return copy;
      });
    }
  }, []);

  const clearReconnect = () => {
    if (reconnectRef.current) {
      clearTimeout(reconnectRef.current);
      reconnectRef.current = null;
    }
  };

  const stopWs = useCallback(() => {
    clearReconnect();
    if (pingRef.current) {
      clearInterval(pingRef.current);
      pingRef.current = null;
    }
    if (wsRef.current) {
      try {
        wsRef.current.close();
      } catch {
        /* ignore */
      }
      wsRef.current = null;
    }
  }, []);

  const startWs = useCallback(() => {
    if (!ENABLE_REALTIME || !active || !authToken) return;
    stopWs();
    attemptRef.current = 0;

    const open = () => {
      if (!mountedRef.current || !active || !authToken) return;
      if (attemptRef.current >= MAX_WS_RECONNECT) return;

      try {
        const url = getRealtimeWebSocketUrl(authToken);
        const ws = new WebSocket(url);
        wsRef.current = ws;

        ws.onopen = () => {
          attemptRef.current = 0;
          void fetchOnce();
          pingRef.current = setInterval(() => {
            try {
              if (ws.readyState === WebSocket.OPEN) ws.send('ping');
            } catch {
              /* ignore */
            }
          }, 25000);
        };

        ws.onmessage = (ev) => {
          if (typeof ev.data === 'string') applyWsMessage(ev.data);
        };

        ws.onclose = () => {
          if (pingRef.current) {
            clearInterval(pingRef.current);
            pingRef.current = null;
          }
          wsRef.current = null;
          if (!mountedRef.current || !active || !authToken) return;
          attemptRef.current += 1;
          if (attemptRef.current >= MAX_WS_RECONNECT) return;
          const delay = Math.min(2000 * attemptRef.current, 12000);
          reconnectRef.current = setTimeout(open, delay);
        };

        ws.onerror = () => {
          try {
            ws.close();
          } catch {
            /* ignore */
          }
        };
      } catch {
        /* invalid ws url */
      }
    };

    open();
  }, [active, authToken, applyWsMessage, fetchOnce, stopWs]);

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
    stopWs();

    if (!active || !authToken) {
      setLocations([]);
      return;
    }

    void fetchOnce();
    pollRef.current = setInterval(() => void fetchOnce(), POLL_MS);
    if (ENABLE_REALTIME) startWs();

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      pollRef.current = null;
      stopWs();
    };
  }, [active, authToken, fetchOnce, startWs, stopWs]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (next: AppStateStatus) => {
      if (appState.current.match(/inactive|background/) && next === 'active' && active && authToken) {
        void fetchOnce();
      }
      appState.current = next;
    });
    return () => sub.remove();
  }, [active, authToken, fetchOnce]);

  return { locations, refresh: fetchOnce, wsConnected: false };
}
