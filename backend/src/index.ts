/**
 * Cloudflare Worker entry: HTTP (Hono) + WebSocket upgrade for realtime hub.
 */

import { RealtimeHub } from './durable/RealtimeHub';
import { app, type WorkerEnv } from './hono-app';
import { handlePublicWebSocket } from './realtime/ws-gateway';

export { RealtimeHub };

export default {
  fetch(request: Request, env: WorkerEnv, ctx: ExecutionContext) {
    const url = new URL(request.url);
    if (url.pathname === '/realtime/ws') {
      return handlePublicWebSocket(request, env);
    }
    return app.fetch(request, env, ctx);
  },
};
