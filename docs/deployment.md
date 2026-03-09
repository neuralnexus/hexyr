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
