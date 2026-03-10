import { describe, expect, it } from 'vitest';
import worker from '../../src/worker';

const env = {
  ASSETS: {
    fetch: async (request: Request) => {
      const url = new URL(request.url);
      return new Response(`asset:${url.pathname}`, { status: 200 });
    },
  },
  APP_NAME: 'Hexyr',
  APP_DOMAIN: 'https://hexyr.com',
};

describe('worker routes', () => {
  it('returns health JSON', async () => {
    const res = await worker.fetch(new Request('https://hexyr.com/api/health'), env as never, {} as never);
    const body = (await res.json()) as { ok: boolean };
    expect(res.status).toBe(200);
    expect(body.ok).toBe(true);
  });

  it('redirects http traffic to https', async () => {
    const res = await worker.fetch(new Request('http://hexyr.com/tool/hex'), env as never, {} as never);
    expect(res.status).toBe(301);
    expect(res.headers.get('location')).toBe('https://hexyr.com/tool/hex');
  });

  it('serves docs index on docs host', async () => {
    const res = await worker.fetch(new Request('https://docs.hexyr.com/'), env as never, {} as never);
    const body = await res.text();
    expect(body).toContain('Hexyr Documentation');
  });

  it('exposes time conversion api endpoint', async () => {
    const res = await worker.fetch(
      new Request('https://hexyr.com/api/tools/time-convert', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ input: '1704067200', zones: ['UTC'] }),
      }),
      env as never,
      {} as never,
    );
    const body = (await res.json()) as { ok: boolean; result: { unixSeconds: number } };
    expect(res.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.result.unixSeconds).toBe(1704067200);
  });
});
