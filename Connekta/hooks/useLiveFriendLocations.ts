import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { FriendLocation, getRealtimeWebSocketUrl, locationAPI } from '@/services/api';

const POLL_MS_FAST = 7000;
const POLL_MS_SLOW = 45000;
const WS_RECONNECT_BASE_MS = 1200;
const WS_RECONNECT_MAX_MS = 30000;

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
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const appState = useRef(AppState.currentState);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttempt = useRef(0);
  const pingTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const shouldConnect = enabled && !!authToken;

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

  const clearTimers = useCallback(() => {
    if (timer.current) {
      clearInterval(timer.current);
      timer.current = null;
    }
    if (pingTimer.current) {
      clearInterval(pingTimer.current);
      pingTimer.current = null;
    }
  }, []);

  const schedulePolling = useCallback(
    (intervalMs: number) => {
      clearTimers();
      void fetchOnce();
      timer.current = setInterval(fetchOnce, intervalMs);
    },
    [clearTimers, fetchOnce]
  );

  const teardownWs = useCallback(() => {
    if (pingTimer.current) {
      clearInterval(pingTimer.current);
      pingTimer.current = null;
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

  const connectWs = useCallback(() => {
    if (!authToken || !enabled) return;
    teardownWs();

    const url = getRealtimeWebSocketUrl(authToken);
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      setWsConnected(true);
      reconnectAttempt.current = 0;
      void fetchOnce();
      pingTimer.current = setInterval(() => {
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
      if (pingTimer.current) {
        clearInterval(pingTimer.current);
        pingTimer.current = null;
      }
      if (!shouldConnect) return;
      const attempt = ++reconnectAttempt.current;
      const delay = Math.min(WS_RECONNECT_BASE_MS * 2 ** Math.min(attempt, 8), WS_RECONNECT_MAX_MS);
      setTimeout(() => {
        if (shouldConnect && !wsRef.current) connectWs();
      }, delay);
    };
  }, [authToken, enabled, applyWsMessage, fetchOnce, shouldConnect, teardownWs]);

  useEffect(() => {
    if (!enabled) {
      teardownWs();
      clearTimers();
      setLocations([]);
      return;
    }

    void fetchOnce();

    if (shouldConnect) {
      schedulePolling(POLL_MS_SLOW);
      connectWs();
    } else {
      schedulePolling(POLL_MS_FAST);
    }

    return () => {
      teardownWs();
      clearTimers();
    };
  }, [enabled, shouldConnect, connectWs, clearTimers, fetchOnce, schedulePolling, teardownWs]);

  useEffect(() => {
    if (!enabled) return;
    if (wsConnected) {
      if (timer.current) {
        clearInterval(timer.current);
        timer.current = null;
      }
      schedulePolling(POLL_MS_SLOW);
    } else if (shouldConnect) {
      schedulePolling(POLL_MS_SLOW);
    } else {
      schedulePolling(POLL_MS_FAST);
    }
  }, [enabled, wsConnected, shouldConnect, schedulePolling]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (next: AppStateStatus) => {
      if (appState.current.match(/inactive|background/) && next === 'active' && enabled) {
        void fetchOnce();
        if (shouldConnect && (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN)) {
          connectWs();
        }
      }
      appState.current = next;
    });
    return () => sub.remove();
  }, [enabled, fetchOnce, shouldConnect, connectWs]);

  return { locations, error, refresh: fetchOnce, wsConnected };
}
