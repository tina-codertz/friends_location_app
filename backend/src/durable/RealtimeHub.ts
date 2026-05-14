import { DurableObject } from 'cloudflare:workers';

type BroadcastBody = {
  targets: number[];
  event: string;
  data: unknown;
};

/**
 * Single global hub: one WebSocket per user id, in-memory fan-out.
 * For larger scale, shard by user id namespace or move to regional hubs.
 */
export class RealtimeHub extends DurableObject {
  /** userId -> server-side WebSocket */
  private sockets = new Map<number, WebSocket>();

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === '/internal/broadcast' && request.method === 'POST') {
      const body = (await request.json()) as BroadcastBody;
      const payload = JSON.stringify({ event: body.event, data: body.data });
      for (const uid of body.targets ?? []) {
        const ws = this.sockets.get(uid);
        if (ws && ws.readyState === WebSocket.OPEN) {
          try {
            ws.send(payload);
          } catch (e) {
            console.error('[RealtimeHub] send failed', uid, e);
          }
        }
      }
      return new Response(JSON.stringify({ ok: true }));
    }

    if (url.pathname === '/internal/ws' && request.headers.get('Upgrade') === 'websocket') {
      const userId = Number(request.headers.get('X-User-Id'));
      if (!userId) {
        return new Response('missing user', { status: 400 });
      }

      const existing = this.sockets.get(userId);
      if (existing) {
        try {
          existing.close(4000, 'replaced');
        } catch {
          /* ignore */
        }
        this.sockets.delete(userId);
      }

      const pair = new WebSocketPair();
      const client = pair[0];
      const server = pair[1];

      server.accept();

      this.sockets.set(userId, server);

      const cleanup = () => {
        const current = this.sockets.get(userId);
        if (current === server) {
          this.sockets.delete(userId);
        }
      };

      server.addEventListener('close', cleanup);
      server.addEventListener('error', cleanup);

      server.addEventListener('message', (evt) => {
        // Optional: client ping/pong — ignore unknown frames
        if (typeof evt.data === 'string' && evt.data === 'ping') {
          try {
            server.send('pong');
          } catch {
            /* ignore */
          }
        }
      });

      return new Response(null, { status: 101, webSocket: client });
    }

    return new Response('Not found', { status: 404 });
  }
}
