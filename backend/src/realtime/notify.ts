import type { WorkerEnv } from '../hono-app';

export type RealtimeEvent = 'friend_request' | 'friend_accepted' | 'location_update';

/**
 * Push a realtime message to connected users (same Durable Object instance).
 * Fire-and-forget from route handlers via executionCtx.waitUntil.
 */
export async function realtimeBroadcast(
  env: WorkerEnv,
  targets: number[],
  event: RealtimeEvent,
  data: unknown
): Promise<void> {
  const unique = [...new Set(targets.filter((n) => Number.isFinite(n) && n > 0))];
  if (!unique.length) return;

  try {
    const id = env.REALTIME_HUB.idFromName('connekta-hub');
    const stub = env.REALTIME_HUB.get(id);
    await stub.fetch('https://internal/broadcast', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targets: unique, event, data }),
    });
  } catch (e) {
    console.error('[realtime] broadcast failed:', e);
  }
}
