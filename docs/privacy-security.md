# Privacy and Security

## Privacy model

- Browser transforms, recipes, binary inspection, and local-file diffing run client-side.
- Payload contents are not persisted server-side.
- No Cloudflare KV or database is used.
- `localStorage` stores only non-sensitive UI preferences and recipe definitions. Recipe payloads,
  intermediate values, and outputs are not stored.
- The service worker caches static same-origin app assets only. It bypasses `/api/*` and never
  caches API traffic or user payloads.

## Remote operations

Calling `/api/*` directly sends the supplied request body to the Worker. Opt-in DNS, RDAP, and HTTP
reachability tools send the requested public target to the Worker and, where required, an upstream
resolver or registry. These paths are separate from local browser transforms.

Do not send production secrets to an API endpoint unless that remote processing is intentional.
The browser Webhook Verifier performs its normal verification locally.

## JWT caveat

JWT decoding in Hexyr is display-only and does not verify signatures.

## Transport security

- Worker enforces HTTPS redirects.
- HSTS is enabled for strict transport.
- Responses include CSP, clickjacking, MIME-sniffing, referrer, permissions, and opener/resource
  isolation policies.
- Tool APIs require JSON, cap bodies at 1 MiB, set `Cache-Control: no-store`, and apply a
  best-effort per-isolate request limiter.
- Network tools reject private/reserved targets, local hostnames, credentials, unsafe schemes,
  custom ports, and redirects to unsafe destinations.

For public production traffic, configure Cloudflare Rate Limiting in addition to the in-process
limiter; Worker isolates do not share process memory.

## Security automation

- SAST: CodeQL, dependency review, and secret scanning.
- DAST: OWASP ZAP baseline against deployment.
