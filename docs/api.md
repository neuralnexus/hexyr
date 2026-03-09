# API Reference

Hexyr's Worker API remains intentionally thin.

## `GET /api/health`

Returns service health and timestamp.

Example response:

```json
{
  "ok": true,
  "service": "hexyr",
  "timestamp": "2026-03-09T00:00:00.000Z"
}
```

## `GET /api/meta`

Returns metadata and runtime flags.

Example response:

```json
{
  "name": "Hexyr",
  "domain": "https://hexyr.com",
  "localFirst": true,
  "persistence": "none",
  "kv": false,
  "runtime": "cloudflare-workers"
}
```
