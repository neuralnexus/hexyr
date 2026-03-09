import { Hono } from 'hono';

type Bindings = {
  APP_NAME?: string;
  APP_DOMAIN?: string;
};

export const metaRoute = new Hono<{ Bindings: Bindings }>();

metaRoute.get('/meta', (c) => {
  return c.json({
    name: c.env.APP_NAME ?? 'Hexyr',
    domain: c.env.APP_DOMAIN ?? 'https://hexyr.com',
    localFirst: true,
    persistence: 'none',
    kv: false,
    runtime: 'cloudflare-workers',
  });
});
