import { verify } from 'hono/jwt';
import type { WorkerEnv } from '../hono-app';

type JwtPayload = {
  userId: number;
  iat: number;
  exp: number;
};

/**
 * Browser / RN clients open a WebSocket here. JWT is passed as ?token= (WS stacks rarely send auth headers).
 */
export async function handlePublicWebSocket(request: Request, env: WorkerEnv): Promise<Response> {
  if (request.headers.get('Upgrade') !== 'websocket') {
    return new Response('Expected WebSocket', { status: 426 });
  }

  const url = new URL(request.url);
  const token = url.searchParams.get('token');
  if (!token) {
    return new Response(JSON.stringify({ error: 'missing_token' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let userId: number;
  try {
    const payload = (await verify(token, env.JWT_SECRET, 'HS256')) as JwtPayload;
    if (!payload?.userId) {
      return new Response(JSON.stringify({ error: 'invalid_token' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
    }
    userId = Number(payload.userId);
  } catch {
    return new Response(JSON.stringify({ error: 'invalid_token' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
  }

  const headers = new Headers(request.headers);
  headers.set('X-User-Id', String(userId));

  const id = env.REALTIME_HUB.idFromName('connekta-hub');
  const stub = env.REALTIME_HUB.get(id);
  return stub.fetch(new Request('https://internal/ws', { method: 'GET', headers }));
}
