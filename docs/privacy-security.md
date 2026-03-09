# Privacy and Security

## Privacy model

- Transforms run client-side by default.
- Payload contents are not persisted server-side.
- No Cloudflare KV is used in MVP.
- `localStorage` stores only non-sensitive UI preferences.

## JWT caveat

JWT decoding in Hexyr is display-only and does not verify signatures.

## Transport security

- Worker enforces HTTPS redirects.
- HSTS is enabled for strict transport.

## Security automation

- SAST: CodeQL, dependency review, and secret scanning.
- DAST: OWASP ZAP baseline against deployment.
