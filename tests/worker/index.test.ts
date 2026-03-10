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

  it('exposes formatter api endpoint', async () => {
    const res = await worker.fetch(
      new Request('https://hexyr.com/api/tools/format', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ input: '{"a":1}', format: 'json', mode: 'format' }),
      }),
      env as never,
      {} as never,
    );
    const body = (await res.json()) as { ok: boolean; output: string };
    expect(res.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.output).toContain('\n  "a": 1');
  });

  it('supports formatter conversion api endpoint', async () => {
    const res = await worker.fetch(
      new Request('https://hexyr.com/api/tools/format', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ input: 'a = 1', from: 'toml', to: 'json', mode: 'format' }),
      }),
      env as never,
      {} as never,
    );
    const body = (await res.json()) as { ok: boolean; output: string; mode: string };
    expect(res.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.mode).toBe('convert');
    expect(body.output).toContain('"a": 1');
  });

  it('applies reasonable rate limiting on tool APIs', async () => {
    const limitedEnv = {
      ...env,
      API_RATE_LIMIT_MAX: '2',
      API_RATE_LIMIT_WINDOW_SECONDS: '60',
    };

    const makeReq = () =>
      worker.fetch(
        new Request('https://hexyr.com/api/tools/format', {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            'cf-connecting-ip': '203.0.113.10',
          },
          body: JSON.stringify({ input: '{"a":1}', kind: 'json', mode: 'validate' }),
        }),
        limitedEnv as never,
        {} as never,
      );

    const first = await makeReq();
    const second = await makeReq();
    const third = await makeReq();

    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    expect(third.status).toBe(429);
    expect(third.headers.get('retry-after')).toBeTruthy();
  });
});
