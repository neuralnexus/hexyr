import { Hono } from 'hono';
import { healthRoute } from './routes/health';
import { metaRoute } from './routes/meta';
import { toolsRoute } from './routes/tools';
import { DOCS_PAGE_HTML } from './utils/docsPage';

type Bindings = {
  ASSETS: Fetcher;
  APP_NAME?: string;
  APP_DOMAIN?: string;
  API_RATE_LIMIT_MAX?: string;
  API_RATE_LIMIT_WINDOW_SECONDS?: string;
};

const app = new Hono<{ Bindings: Bindings }>();

type RateBucket = {
  count: number;
  resetAt: number;
};

const rateBuckets = new Map<string, RateBucket>();

function getClientIp(request: Request): string {
  const cfIp = request.headers.get('cf-connecting-ip');
  if (cfIp) return cfIp.trim();
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) return forwardedFor.split(',')[0].trim();
  return 'local';
}

function parsePositiveInt(value: string | undefined, fallback: number): number {
  const parsed = Number.parseInt(value ?? '', 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

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

app.use('/api/tools/*', async (c, next) => {
  const max = parsePositiveInt(c.env.API_RATE_LIMIT_MAX, 120);
  const windowSeconds = parsePositiveInt(c.env.API_RATE_LIMIT_WINDOW_SECONDS, 60);
  const windowMs = windowSeconds * 1000;
  const now = Date.now();
  const clientIp = getClientIp(c.req.raw);
  const key = `tools:${clientIp}`;

  const existing = rateBuckets.get(key);
  const bucket = !existing || existing.resetAt <= now ? { count: 0, resetAt: now + windowMs } : existing;
  bucket.count += 1;
  rateBuckets.set(key, bucket);

  if (bucket.count > max) {
    const retryAfterSeconds = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));
    c.header('Retry-After', String(retryAfterSeconds));
    c.header('X-RateLimit-Limit', String(max));
    c.header('X-RateLimit-Remaining', '0');
    c.header('X-RateLimit-Reset', String(Math.floor(bucket.resetAt / 1000)));
    return c.json({ ok: false, error: 'Rate limit exceeded', retryAfterSeconds }, 429);
  }

  await next();
  c.header('X-RateLimit-Limit', String(max));
  c.header('X-RateLimit-Remaining', String(Math.max(0, max - bucket.count)));
  c.header('X-RateLimit-Reset', String(Math.floor(bucket.resetAt / 1000)));

  if (rateBuckets.size > 5000) {
    for (const [bucketKey, value] of rateBuckets.entries()) {
      if (value.resetAt <= now) rateBuckets.delete(bucketKey);
    }
  }
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
