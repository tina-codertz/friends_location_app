import { env, createExecutionContext, waitOnExecutionContext } from 'cloudflare:test';
import { describe, it, expect } from 'vitest';
import worker from '../src/index';

const IncomingRequest = Request<unknown, IncomingRequestCfProperties>;

describe('API worker', () => {
  it('returns JSON health on /', async () => {
    const request = new IncomingRequest('http://example.com/');
    const ctx = createExecutionContext();
    const response = await worker.fetch(request, env, ctx);
    await waitOnExecutionContext(ctx);
    expect(response.ok).toBe(true);
    const body = (await response.json()) as { message?: string; version?: string };
    expect(body.message).toContain('Friends');
    expect(body.version).toBeDefined();
  });
});
