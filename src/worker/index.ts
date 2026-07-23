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

  c.header('X-Content-Type-Options', 'nosniff');
  c.header('Referrer-Policy', 'no-referrer');
  c.header('X-Frame-Options', 'DENY');
  c.header('Cross-Origin-Opener-Policy', 'same-origin');
  c.header('Cross-Origin-Resource-Policy', 'same-origin');
  c.header(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), payment=(), usb=(), serial=(), bluetooth=(), browsing-topics=()',
  );
  c.header(
    'Content-Security-Policy',
    "default-src 'self'; base-uri 'none'; connect-src 'self'; font-src 'self'; form-action 'self'; frame-ancestors 'none'; img-src 'self' data: blob:; manifest-src 'self'; object-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'; worker-src 'self' blob:; upgrade-insecure-requests",
  );

  if (!isLocalHost && protocol !== 'https') {
    return c.redirect(`https://${url.host}${url.pathname}${url.search}`, 301);
  }

  await next();
  c.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  if (url.pathname.startsWith('/api/')) {
    c.header('Cache-Control', 'no-store');
  }
});

app.use('/api/tools/*', async (c, next) => {
  if (c.req.method === 'POST') {
    const contentType = c.req.header('content-type')?.toLowerCase() ?? '';
    if (!contentType.startsWith('application/json')) {
      return c.json({ ok: false, error: 'Content-Type must be application/json.' }, 415);
    }
    const contentLength = Number.parseInt(c.req.header('content-length') ?? '0', 10);
    if (Number.isFinite(contentLength) && contentLength > 1024 * 1024) {
      return c.json({ ok: false, error: 'JSON request body exceeds the 1 MiB limit.' }, 413);
    }
  }

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
    while (rateBuckets.size > 5000) {
      const oldest = rateBuckets.keys().next().value as string | undefined;
      if (!oldest) break;
      rateBuckets.delete(oldest);
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
