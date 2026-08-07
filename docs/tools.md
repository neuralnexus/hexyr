# Tools Reference

## Universal Inspector

Paste unknown payloads, get format detection, warnings, entropy hints, and fast shortcuts into specialized tools.

## Core tools

- Text <-> Hex / Base64 / Binary transforms
- URL encode/decode and HTML entities
- Compression/decompression (gzip/deflate, auto-decompress fallback)
- Local Recipe Pipeline:
  - Chain deterministic encoders, decoders, JSON steps, and gzip transforms
  - Inspect every intermediate value and the character-count change at each step
  - Load built-in presets, save definition-only recipes locally, or import/export versioned JSON
- Formatter Lab (expand/minify/validate JSON/YAML/TOML/XML/INI/SQL/HTTP)
- ASCII Art Generator (text fonts + image-to-ASCII)

## Inspection tools

- JWT inspector and Unicode explorer
- Hex Viewer:
  - Open or drop local files without uploading them
  - 18-group byte-spectrum coloring (leading nibble plus distinct `00` and `ff`)
  - Semantic and color-free display modes
  - Hex/text search, offset jump, paged rendering, byte statistics, and synchronized ASCII selection
  - Clickable structure overlays for PNG, JPEG, GIF, ZIP, ELF, PE, and PDF containers
- Binary and Payload Diff:
  - Strict text/hex/base64 decoding without silent fallback
  - Two-file local comparison up to 32 MiB per side
  - Byte-level change runs, synchronized selection, paging, and next/previous change navigation

The byte-spectrum approach is inspired by Alice Pellerin's
[“your hex editor should color-code bytes”](https://simonomi.dev/blog/color-code-your-bytes/).

- X.509 inspector, TLS verifier, ASN.1/DER viewer
- HAR inspector, Cookie analyzer, Schema validators
- DNS Tools:
  - Zone formatter/validator
  - Lookup toolkit (MX, TXT, DMARC, SPF, RDAP/Whois, blacklist, domain health, and related DNS records)

## Offline use

Hexyr can be installed as a PWA. The app shell and tool chunks you have opened are available
offline. The service worker does not cache API requests, API responses, or payloads. Network tools
show normal connection errors while offline; local tools continue to work.

## Crypto and utility tools

- Hash/HMAC and HTTP signer
- Webhook signature verifier (Stripe/GitHub/Slack)
- HTTP replay builder
- UUID/ULID/KSUID utility
- Timezone/ISO8601 lab
