# Hexyr Implementation Plan

## Project Context
- Build in current repo: `neuralnexus/hexyr`
- Deployment target: `hexyr.com` on Cloudflare Workers
- Product: Hexyr - local-first developer hex/encoding toolkit
- Constraints:
  - No Cloudflare KV
  - No GenAI dependencies in MVP
  - Client-side transforms by default
  - Thin Worker with `/api/*` routes
  - Privacy-first: no payload logging or backend persistence

## Goals
1. Ship a production-grade React + Vite + TypeScript app with premium UX.
2. Implement Universal Inspector + specialized tools for encoding, decoding, inspection, hashing, and byte operations.
3. Keep architecture deterministic, modular, and Worker-compatible.
4. Include real tests, CI, deploy workflow, and complete docs.

## Architecture
- `src/app/*`: UI shell, routing, layouts, components, feature views
- `src/shared/*`: deterministic pure utilities
  - `encoding`, `crypto`, `analysis`, `detection`, `parsing`, `explainers`, `types`
- `src/worker/*`: Hono Worker API + future-ready edge routing
- `tests/*`: Vitest utility tests with fixtures/vectors

## Milestones

### M1 - Scaffold and Config
- Setup Vite + React + TypeScript + Tailwind + Lucide
- Add ESLint, Prettier, strict TS, Vitest
- Configure Wrangler for SPA assets + Worker API namespace
- Scripts: `dev`, `build`, `preview`, `deploy`, `lint`, `typecheck`, `test`
- Add branding assets from `graphics/` into `public/`

### M2 - Shared Deterministic Engine
- Encoding/transforms:
  - Text<->Hex, Text<->Base64 (+url-safe), Text<->Binary
  - URL encode/decode, HTML entities encode/decode
  - Unicode inspector (code points, UTF-8 bytes, UTF-16 units)
- Detection:
  - hex, base64, base64url, binary, JWT, JSON, URL-encoded, UTF-8 text
- Parsing/inspection:
  - JWT structural split/decode (header/payload/signature)
  - timestamp and IPv4/int helpers
- Analysis:
  - byte/char/bit/line counts
  - base64 padding and URL-safe hints
  - entropy + histogram + malformed highlighting
  - magic bytes (PNG/JPEG/GIF/PDF/ZIP/ELF/PE)
- Crypto:
  - SHA-1/256/384/512 + HMAC via Web Crypto
  - optional MD5 marked legacy/insecure only
- Deterministic explainers module:
  - `explainHexDump(input: string): string`
  - `suggestDecodingStrategies(input: string): string`

### M3 - App Shell and UX Foundation
- Three-pane desktop layout:
  - Left: categorized tool nav
  - Center: active workspace
  - Right: metadata/stats/warnings/quick actions
- Top bar:
  - logo/wordmark, command bar skeleton (Ctrl+K), theme toggle, docs/github placeholders
- Bottom utility row:
  - keyboard hints + privacy/docs links
- Accessibility + keyboard nav + visible focus states
- Responsive behavior:
  - desktop 3-pane
  - tablet collapsible panels
  - mobile single-column tabs/drawers

### M4 - Universal Inspector (Primary)
- Paste-anything input + drag/drop text/small binaries
- Format likelihood detection with warnings and metadata
- Suggested next actions + jump links into specialized tools
- Preserve input through route transitions (memory state)
- Optional URL-hash share state scaffold (client-side only)

### M5 - Specialized Tool Routes
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
- Ensure reusable panel actions:
  - copy, clear, swap (where reversible), formatting toggles

### M6 - Performance Pass
- Lazy-load heavier modules/routes
- Web Worker for heavy entropy/histogram/file analysis above threshold
- Chunk/virtualized rendering for large hexdump output
- Keep UI responsive under large pasted payloads

### M7 - Worker/API
- Hono routes:
  - `GET /api/health`
  - `GET /api/meta`
- No payload-content logging
- No persistence
- No KV/D1
- Keep Worker startup and bundle lean

### M8 - Tests
- Vitest coverage for:
  - hex parsing/formatting edge cases
  - base64 detection and padding hints
  - binary validation
  - JWT structural parsing
  - entropy helper
  - magic bytes detection
  - timestamp conversion
  - hash/HMAC vectors
- Include malformed and adversarial edge cases

### M9 - CI/CD and Docs
- `.github/workflows/ci.yml`:
  - install, lint, typecheck, test, build
- `.github/workflows/deploy.yml`:
  - deploy on `main` using Wrangler
  - document required secrets
- README:
  - product purpose, architecture, privacy model, local-first rationale
  - Universal Inspector concept
  - no-KV note
  - JWT decode vs verify caveat
  - local dev/build/deploy/testing
  - roadmap and security notes
- Add MIT license

## Tradeoff Decisions
- Client-side transforms prioritized for privacy/speed.
- Heuristic detection in Inspector; strict behavior in specialized tools.
- Thin Worker only for metadata/status and static runtime integration.
- Optional URL-share state only if it remains clean and stateless.
- MD5 only as legacy compatibility with explicit security warning.

## Risks and Mitigations
- Scope risk: implement core shared engine first, then feature routes incrementally.
- Performance risk: lazy loading + worker offload + chunked rendering.
- UX consistency risk: central design tokens and reusable panel components.
- Deployment risk: explicit Wrangler asset + route config and CI verification.

## Definition of Done
- App runs locally and builds cleanly.
- Cloudflare Worker serves SPA with `/api/*` routes and SPA fallback.
- Universal Inspector + all MVP tools function.
- Tests pass, CI passes, deploy workflow ready.
- README and security/privacy notes complete.
