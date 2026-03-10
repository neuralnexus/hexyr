# API Reference

Hexyr exposes a compact integration API on the Worker.

- Base URL: `https://hexyr.com`
- OpenAPI: `https://hexyr.com/openapi.json`

## Health and Discovery

### `GET /api/health`

```bash
curl -s https://hexyr.com/api/health
```

### `GET /api/meta`

```bash
curl -s https://hexyr.com/api/meta
```

### `GET /api/tools`

Lists currently available tool endpoints.

```bash
curl -s https://hexyr.com/api/tools
```

## Tool Endpoints (curl)

### `POST /api/tools/time-convert`

```bash
curl -s https://hexyr.com/api/tools/time-convert \
  -H 'content-type: application/json' \
  -d '{
    "input": "2026-03-09T15:00:00",
    "sourceZone": "America/New_York",
    "zones": ["UTC", "America/Los_Angeles", "Europe/London", "Asia/Tokyo"]
  }'
```

### `POST /api/tools/dns`

```bash
curl -s https://hexyr.com/api/tools/dns \
  -H 'content-type: application/json' \
  -d '{
    "zoneText": "$ORIGIN example.com.\n$TTL 300\n@ IN A 192.0.2.1\nwww 60 IN CNAME @",
    "format": true
  }'
```

### `POST /api/tools/webhook-verify`

```bash
curl -s https://hexyr.com/api/tools/webhook-verify \
  -H 'content-type: application/json' \
  -d '{
    "provider": "github",
    "payload": "{\"event\":\"ping\"}",
    "secret": "your_webhook_secret",
    "signatureHeader": "sha256=<signature_hex>"
  }'
```

### `POST /api/tools/har-inspect`

```bash
curl -s https://hexyr.com/api/tools/har-inspect \
  -H 'content-type: application/json' \
  -d '{
    "harText": "{\"log\":{\"entries\":[]}}",
    "redactionExport": true
  }'
```

### `POST /api/tools/cookie-analyze`

```bash
curl -s https://hexyr.com/api/tools/cookie-analyze \
  -H 'content-type: application/json' \
  -d '{
    "setCookieText": "Set-Cookie: sid=abc123; Path=/; HttpOnly; Secure; SameSite=Lax"
  }'
```

### `POST /api/tools/id-inspect`

```bash
curl -s https://hexyr.com/api/tools/id-inspect \
  -H 'content-type: application/json' \
  -d '{
    "id": "01HV8CC6D4Z1PT6M9QV3AH7X6N"
  }'
```

### `POST /api/tools/policy-lint`

```bash
curl -s https://hexyr.com/api/tools/policy-lint \
  -H 'content-type: application/json' \
  -d '{
    "rawHeaders": "HTTP/1.1 200 OK\ncontent-type: text/html\naccess-control-allow-origin: *\naccess-control-allow-credentials: true"
  }'
```
