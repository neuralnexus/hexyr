import { Hono } from 'hono';
import { healthRoute } from './routes/health';
import { metaRoute } from './routes/meta';

type Bindings = {
  ASSETS: Fetcher;
  APP_NAME?: string;
  APP_DOMAIN?: string;
};

const app = new Hono<{ Bindings: Bindings }>();

app.route('/api', healthRoute);
app.route('/api', metaRoute);

app.get('/api/*', (c) => {
  return c.json({ ok: false, error: 'Not Found' }, 404);
});

app.all('*', async (c) => {
  return c.env.ASSETS.fetch(c.req.raw);
});

export default app;
