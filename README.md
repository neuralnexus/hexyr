# Hexyr

Hexyr is a local-first developer hex and encoding toolkit for quickly understanding unknown payloads.

**Tagline:** A Swiss-Army knife for developers who constantly need to encode, decode, inspect, and understand data.

## Why Hexyr Exists

Developers repeatedly paste opaque payloads into ad hoc scripts, random online tools, or terminal one-liners. Hexyr provides a single deterministic workspace that feels fast, trustworthy, and privacy-conscious.

## Screenshots

- Placeholder: add desktop workspace screenshot
- Placeholder: add mobile workspace screenshot

## Core Features

- Universal Inspector (paste-anything workflow)
- Text <-> Hex, Base64, Binary transforms
- URL and HTML entity encode/decode
- Unicode inspection (code points, UTF-8 bytes, UTF-16 units)
- JWT inspector with decode warnings and claim highlighting
- Hexdump formatter with offsets and ASCII preview
- Hash + HMAC helpers via Web Crypto
- Bitwise operations, endianness swap, IPv4/int conversion, timestamp conversion
- Entropy, stats, frequency hints, magic byte detection
- Deterministic explainers (rule-based, no external AI)

## Universal Inspector

`/inspect` is the primary mode:

- Accepts pasted input or dropped files
- Detects likely formats (hex/base64/base64url/binary/JWT/JSON/etc.)
- Shows warnings and metadata
- Suggests and links to specialized tools while preserving workspace input

## Architecture Overview

- `src/app`: React SPA, UI shell, routes, feature workspaces
- `src/shared`: Pure deterministic utilities (encoding, detection, parsing, analysis, crypto, explainers)
- `src/worker`: Thin Hono Worker for `/api/health` and `/api/meta`
- `tests`: Vitest unit tests for deterministic modules

Core transforms run client-side by default. The Worker is intentionally lean and future-ready.

## Privacy Model

- Payload transforms are client-side in MVP
- No backend persistence
- No payload-content logging
- No Cloudflare KV
- `localStorage` is used only for non-sensitive UI preferences (theme, last selected tool)

## Local-First Rationale

Local execution keeps interactions faster, lowers edge complexity, and reduces risk when developers inspect sensitive payloads.

## Cloudflare Notes

- Deployment target: `hexyr.com`
- Docs target: `docs.hexyr.com`
- Runtime: Cloudflare Workers + static SPA assets
- SPA fallback is configured for routes like `/tool/hex`
- API namespace is explicit under `/api/*`
- KV is intentionally not used

## SEO and Crawlability

- `robots.txt` is included in `public/robots.txt`
- XML sitemap is included in `public/sitemap.xml`
- Canonical, Open Graph, and Twitter metadata are configured in `index.html`

## Routes

- `/`
- `/inspect`
- `/tool/hex`
- `/tool/base64`
- `/tool/binary`
- `/tool/url`
- `/tool/html`
- `/tool/unicode`
- `/tool/jwt`
- `/tool/hash`
- `/tool/bitwise`
- `/tool/hexdump`
- `/api/health`
- `/api/meta`

## Local Development

```bash
pnpm install
pnpm dev
```

## Build

```bash
pnpm build
pnpm preview
```

## Deploy to Cloudflare Workers

1. Set secrets or env vars:
   - `CLOUDFLARE_API_TOKEN`
   - `CLOUDFLARE_ACCOUNT_ID`
2. Authenticate Wrangler if needed:

```bash
pnpm exec wrangler login
```

3. Deploy:

```bash
pnpm run deploy
```

## GitHub Actions

- CI workflow runs lint, typecheck, test, and build on PRs and `main` pushes.
- Deploy workflow runs on `main` and deploys with Wrangler.
- Security SAST workflow runs CodeQL, dependency review (PR), and secret scanning via Gitleaks.
- Security DAST workflow runs OWASP ZAP baseline against `https://hexyr.com` on schedule and manual dispatch.

### Security Scanning Notes

- SAST findings are surfaced in GitHub Security alerts when Advanced Security/Code scanning is enabled.
- DAST is non-destructive baseline crawling and report generation.
- You can manually run DAST with a custom URL from the Actions tab (`target_url` input).

## Contributing

Community contributions are welcome. Please read `CONTRIBUTING.md` for branch/PR workflow, quality gates, and privacy/security expectations.

Required GitHub secrets:

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

## Project Structure

```txt
src/
  app/
  shared/
  worker/
tests/
.github/workflows/
```

## Testing

Run all tests:

```bash
pnpm test
```

Includes deterministic coverage for encoding, detection, parsing, entropy, magic bytes, and crypto helpers.

## Security Notes

- Hexyr is decode/inspection focused.
- JWT decode is **not** signature verification.
- Do not treat decoded JWT payloads as trusted unless signature and claims are validated in your own auth context.
- Avoid pasting production secrets into third-party tools; Hexyr is built to keep this local-first.

## Roadmap Ideas

- Structured compare mode for two payloads
- Optional local-only encrypted workspace snapshots
- Additional file signature and container format coverage
- Advanced command palette and keyboard workflows
- Large payload virtualization improvements

## License

MIT
