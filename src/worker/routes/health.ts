import { Hono } from 'hono';

export const healthRoute = new Hono();

healthRoute.get('/health', (c) => {
  return c.json({
    ok: true,
    service: 'hexyr',
    timestamp: new Date().toISOString(),
  });
});
