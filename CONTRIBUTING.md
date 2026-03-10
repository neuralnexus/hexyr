# Contributing to Hexyr

Thanks for checking out this page. Contributions are welcome. If you want to help improve Hexyr, you're in the right place. 

## Ground Rules

- Keep the product local-first and privacy-first.
- Do not add backend persistence. This is a security standard. 
- Do not add Cloudflare KV for current architecture. What can I say? I'm cheap. 
- Keep deterministic behavior for core transforms and analysis.

## Development Setup

```bash
pnpm install
pnpm dev
```

Before opening a PR, run:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

## Branch and PR Workflow

1. Create a feature branch from `main`.
2. Keep PRs focused and small when possible.
3. Include tests for all logic changes.
4. Update docs for behavior, route, or API changes.
5. Fill in PR summary with:
   - Problem addressed
   - Approach and tradeoffs
   - Test coverage added
   - Screenshots for UI changes

## Coding Expectations

- TypeScript strict-compatible code.
- Prefer pure shared utilities in `src/shared`.
- Keep Worker routes minimal and edge-safe.
- Avoid large dependencies that inflate startup/bundle cost.
- Maintain accessibility and keyboard support in UI components.
- Please ensure you have commit signing enabled. 

## Security Expectations

- Never log sensitive payload contents.
- Treat JWT decoding as display-only unless explicit verification is implemented.
- Keep secrets out of source and tests.
- Respect SAST/DAST findings and resolve high-severity issues before merge.

## Community PR Checklist

- [ ] Lint/typecheck/test/build pass locally
- [ ] New behavior covered by tests
- [ ] README/docs updated if needed
- [ ] No breaking API/route changes without notes
- [ ] No regressions to privacy model
