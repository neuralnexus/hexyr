# Getting Started

## Run locally

```bash
pnpm install
pnpm dev
```

## Build

```bash
pnpm build
pnpm preview
```

## Key routes

- `/inspect` Universal Inspector
- `/tool/*` specialized developer tools
- `/tool/hexdump` local file and structured binary viewer
- `/tool/diff` binary/payload and two-file diff
- `/tool/recipe` reusable local transform pipelines
- `/api/health` service status
- `/api/meta` runtime metadata

## Offline install

Run a production build or open the deployed site once, then install Hexyr from the browser's app
menu. Static assets and tool chunks are cached as they are opened; network tools still require a
connection.
