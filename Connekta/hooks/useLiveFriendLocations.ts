import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { FriendLocation, getRealtimeWebSocketUrl, locationAPI } from '@/services/api';

/** Backup sync when WebSocket is unavailable */
const POLL_MS_NO_WS = 8000;
/** Infrequent REST catch-up while WebSocket is healthy */
const POLL_MS_WITH_WS = 40000;

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

export function useLiveFriendLocations(enabled: boolean, authToken: string | null) {
  const [locations, setLocations] = useState<FriendLocation[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [wsConnected, setWsConnected] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const attemptRef = useRef(0);
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

  const applyWsMessage = useCallback((raw: string) => {
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
    setWsConnected(false);
  }, []);

  const startWs = useCallback(() => {
    if (!enabled || !authToken) return;
    stopWs();
    attemptRef.current = 0;

    const open = () => {
      const url = getRealtimeWebSocketUrl(authToken);
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        setWsConnected(true);
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

      ws.onerror = () => {
        setError('Realtime connection error');
      };

      ws.onclose = () => {
        setWsConnected(false);
        if (pingRef.current) {
          clearInterval(pingRef.current);
          pingRef.current = null;
        }
        wsRef.current = null;
        if (!enabled || !authToken) return;
        const n = ++attemptRef.current;
        const delay = Math.min(1500 * 2 ** Math.min(n, 6), 28000);
        reconnectRef.current = setTimeout(open, delay);
      };
    };

    open();
  }, [enabled, authToken, applyWsMessage, fetchOnce, stopWs]);

  useEffect(() => {
    if (!enabled) {
      stopWs();
      if (pollRef.current) clearInterval(pollRef.current);
      pollRef.current = null;
      setLocations([]);
      return;
    }

    void fetchOnce();

    if (pollRef.current) clearInterval(pollRef.current);
    const pollMs = authToken ? POLL_MS_WITH_WS : POLL_MS_NO_WS;
    pollRef.current = setInterval(fetchOnce, pollMs);

    if (authToken) {
      startWs();
    } else {
      stopWs();
    }

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      pollRef.current = null;
      stopWs();
    };
  }, [enabled, authToken, fetchOnce, startWs, stopWs]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (next: AppStateStatus) => {
      if (appState.current.match(/inactive|background/) && next === 'active' && enabled) {
        void fetchOnce();
        if (authToken) startWs();
      }
      appState.current = next;
    });
    return () => sub.remove();
  }, [enabled, authToken, fetchOnce, startWs]);

  return { locations, error, refresh: fetchOnce, wsConnected };
}
