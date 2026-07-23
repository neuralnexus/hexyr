# Deployment

## Cloudflare Worker

Hexyr deploys as a Worker serving static SPA assets and `/api/*` routes.

## Deploy command

```bash
pnpm run deploy
```

## Domains

- `https://hexyr.com` app
- `https://docs.hexyr.com` docs

## GitHub Actions secrets

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

## Notes

- Keep Worker logic lean and deterministic.
- No KV bindings are configured.
- Configure Cloudflare Rate Limiting for `/api/tools/*`; the built-in limiter is per Worker isolate.
- Keep the CSP and private-network target protections enabled when adding new API or probe routes.
- Bump the cache name in `public/sw.js` when a service-worker caching policy changes.
