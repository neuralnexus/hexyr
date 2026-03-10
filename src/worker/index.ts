import { Hono } from 'hono';
import { healthRoute } from './routes/health';
import { metaRoute } from './routes/meta';
import { toolsRoute } from './routes/tools';
import { DOCS_PAGE_HTML } from './utils/docsPage';

type Bindings = {
  ASSETS: Fetcher;
  APP_NAME?: string;
  APP_DOMAIN?: string;
};

const app = new Hono<{ Bindings: Bindings }>();

app.use('*', async (c, next) => {
  const url = new URL(c.req.url);
  const forwardedProto = c.req.header('x-forwarded-proto');
  const protocol = forwardedProto ?? url.protocol.replace(':', '');
  const isLocalHost = url.hostname === 'localhost' || url.hostname === '127.0.0.1';

  if (!isLocalHost && protocol !== 'https') {
    return c.redirect(`https://${url.host}${url.pathname}${url.search}`, 301);
  }

  await next();
  c.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
});

app.route('/api', healthRoute);
app.route('/api', metaRoute);
app.route('/api', toolsRoute);

app.get('/api/*', (c) => {
  return c.json({ ok: false, error: 'Not Found' }, 404);
});

app.all('*', async (c) => {
  const url = new URL(c.req.url);
  const host = (c.req.header('host') ?? url.hostname).toLowerCase().split(':')[0];
  if (host === 'docs.hexyr.com') {
    const isApi = url.pathname.startsWith('/api/');
    const isStaticAsset = /\.[a-zA-Z0-9]+$/.test(url.pathname);
    if (!isApi && !isStaticAsset) {
      return c.html(DOCS_PAGE_HTML);
    }
  }
  return c.env.ASSETS.fetch(c.req.raw);
});

export default app;
