export const DOCS_PAGE_HTML = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Hexyr Docs</title>
    <style>
      :root { color-scheme: dark; }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        font-family: Inter, system-ui, sans-serif;
        background-color: #07090d;
        color: #e2e8f0;
        background-image:
          radial-gradient(1200px circle at 10% -20%, rgba(52, 214, 255, 0.11), transparent 60%),
          radial-gradient(850px circle at 90% 10%, rgba(122, 125, 255, 0.08), transparent 55%);
      }
      header {
        height: 56px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0 16px;
        border-bottom: 1px solid rgba(255,255,255,.1);
        backdrop-filter: blur(6px);
        background: rgba(13, 17, 23, 0.8);
      }
      .brand-chip {
        display: inline-flex;
        align-items: center;
        gap: 10px;
        border: 1px solid rgba(255,255,255,.1);
        border-radius: 10px;
        padding: 6px 12px;
        background: linear-gradient(135deg, rgba(52, 214, 255, 0.16), rgba(122, 125, 255, 0.1));
      }
      .brand-chip img { width: 18px; height: 18px; }
      .brand-name { font-size: 11px; text-transform: uppercase; letter-spacing: .2em; color: #7dd3fc; }
      .brand-sub { margin-top: 2px; font-family: "JetBrains Mono", ui-monospace, monospace; font-size: 10px; color: #94a3b8; }
      main { max-width: 1160px; margin: 0 auto; padding: 28px 20px 56px; }
      h1 { margin: 0 0 10px; font-size: clamp(1.9rem, 4vw, 2.4rem); letter-spacing: -0.02em; }
      h2 { margin: 0 0 10px; font-size: 1.65rem; letter-spacing: -0.02em; color: #e2e8f0; }
      h3 { margin: 0 0 8px; font-size: 1.15rem; color: #dbe7f5; }
      p, li { color: #94a3b8; line-height: 1.62; }
      .hero {
        border: 1px solid rgba(255,255,255,.12);
        border-radius: 16px;
        padding: 20px;
        background:
          linear-gradient(160deg, rgba(13,17,23,.95), rgba(8,12,20,.92)),
          radial-gradient(600px circle at 20% -10%, rgba(52,214,255,.16), transparent 50%);
        margin-bottom: 14px;
      }
      .hero p { margin: 0; max-width: 760px; }
      .hero-actions { margin-top: 14px; display: flex; flex-wrap: wrap; gap: 8px; }
      .action {
        display: inline-flex;
        align-items: center;
        border: 1px solid rgba(103,232,249,.35);
        color: #9de7f6;
        border-radius: 10px;
        padding: 6px 10px;
        font-size: 12px;
      }
      .layout { display: grid; gap: 14px; grid-template-columns: 1fr; }
      @media (min-width: 980px) { .layout { grid-template-columns: 260px 1fr; align-items: start; } }
      .card {
        border: 1px solid rgba(255,255,255,.12);
        background: rgba(13,17,23,.88);
        border-radius: 12px;
        padding: 16px;
      }
      .doc-body { padding: 18px; }
      .kpis { display: grid; gap: 8px; margin-top: 14px; grid-template-columns: repeat(2, minmax(0, 1fr)); }
      @media (min-width: 720px) { .kpis { grid-template-columns: repeat(4, minmax(0, 1fr)); } }
      .kpi {
        border: 1px solid rgba(148,163,184,.2);
        border-radius: 10px;
        padding: 8px 10px;
        background: rgba(10,14,22,.65);
      }
      .kpi strong { display: block; color: #e2e8f0; font-size: 13px; }
      .kpi span { font-size: 11px; color: #8da2b8; }
      .tool-grid { display: grid; gap: 10px; grid-template-columns: 1fr; margin-top: 8px; }
      @media (min-width: 860px) { .tool-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
      .tool-card {
        border: 1px solid rgba(148,163,184,.2);
        border-radius: 10px;
        padding: 10px;
        background: rgba(9,14,24,.5);
      }
      .tool-card b { color: #d9e7f5; }
      .toc { position: sticky; top: 74px; }
      .toc a {
        display: block;
        padding: 9px 10px;
        border-radius: 8px;
        color: #cbd5e1;
        border: 1px solid transparent;
      }
      .toc a:hover {
        background: rgba(148, 163, 184, .12);
        border-color: rgba(148, 163, 184, .2);
        text-decoration: none;
      }
      .section { padding: 10px 0 8px; border-bottom: 1px solid rgba(148,163,184,.14); }
      .section:last-child { border-bottom: 0; }
      section { scroll-margin-top: 72px; }
      a { color: #67e8f9; text-decoration: none; }
      a:hover { color: #a5f3fc; text-decoration: underline; }
      .pill {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        border: 1px solid rgba(255,255,255,.14);
        border-radius: 999px;
        padding: 4px 10px;
        color: #cbd5e1;
        font-size: 12px;
      }
      footer {
        margin-top: 20px;
        color: #64748b;
        font-size: 12px;
        display: flex;
        justify-content: space-between;
        gap: 10px;
        flex-wrap: wrap;
      }
      code { color: #a5f3fc; font-family: "JetBrains Mono", ui-monospace, monospace; }
    </style>
  </head>
  <body>
    <header>
      <a class="brand-chip" href="https://hexyr.com" aria-label="Open Hexyr app">
        <img src="/icons/hexyr-mark.svg" alt="Hexyr logo" />
        <span>
          <div class="brand-name">Hexyr</div>
          <div class="brand-sub">Developer Toolkit</div>
        </span>
      </a>
      <a class="pill" href="https://hexyr.com">Open App</a>
    </header>
    <main>
      <div class="hero">
        <h1>Hexyr Documentation</h1>
        <p>
          Everything you need to run, deploy, and contribute to Hexyr.
          Hexyr is a local-first, privacy-conscious toolkit for inspecting and transforming developer payloads.
        </p>
        <div class="hero-actions">
          <a class="action" href="https://hexyr.com">Open App</a>
          <a class="action" href="https://hexyr.com/inspect">Universal Inspector</a>
          <a class="action" href="https://hexyr.com/tool/signer">HTTP Signer</a>
        </div>
        <div class="kpis">
          <div class="kpi"><strong>Local-first</strong><span>Payloads stay in browser</span></div>
          <div class="kpi"><strong>Deterministic</strong><span>No GenAI in MVP transforms</span></div>
          <div class="kpi"><strong>Cloudflare-ready</strong><span>Worker + assets architecture</span></div>
          <div class="kpi"><strong>Integration API</strong><span>/api/tools endpoints for automation</span></div>
        </div>
      </div>

      <div class="layout">
        <aside class="card toc">
          <h2>Docs</h2>
          <a href="#getting-started">Getting Started</a>
          <a href="#tools">Tools Reference</a>
          <a href="#privacy">Privacy & Security</a>
          <a href="#api">API</a>
          <a href="#deployment">Deployment</a>
          <a href="#contributing">Contributing</a>
        </aside>

        <article class="card doc-body">
          <section id="getting-started" class="section">
            <h3>Getting Started</h3>
            <p>Run Hexyr locally with:</p>
            <p><code>pnpm install</code><br /><code>pnpm dev</code></p>
            <p>Build with <code>pnpm build</code>, then preview using <code>pnpm preview</code>.</p>
          </section>

          <section id="tools" class="section">
            <h3>Tools Reference</h3>
            <div class="tool-grid">
              <div class="tool-card"><b>Universal Inspector</b><p>Paste unknown data, get format hints, warnings, and quick actions.</p></div>
              <div class="tool-card"><b>Encoding Core</b><p>Text/Hex/Base64/Binary/URL/HTML/Unicode transforms with reversible flows.</p></div>
              <div class="tool-card"><b>Inspection</b><p>JWT, Hexdump, ASN.1/DER, TLS verifier, compact-binary byte inspectors.</p></div>
              <div class="tool-card"><b>Automation Utilities</b><p>HTTP signer/replay, regex extract, diff mode, batch transform, schema checks.</p></div>
            </div>
          </section>

          <section id="privacy" class="section">
            <h3>Privacy & Security</h3>
            <ul>
              <li>Transforms run client-side by default.</li>
              <li>No backend payload persistence in MVP.</li>
              <li>JWT decoding is view-only and does not verify signatures.</li>
            </ul>
          </section>

          <section id="api" class="section">
            <h3>API</h3>
            <p>Worker API supports health/meta plus integration tool endpoints:</p>
            <ul>
              <li><code>GET /api/health</code></li>
              <li><code>GET /api/meta</code></li>
              <li><code>GET /api/tools</code></li>
              <li><code>POST /api/tools/time-convert</code> (timezone conversion)</li>
              <li><code>POST /api/tools/dns</code>, <code>/webhook-verify</code>, <code>/har-inspect</code></li>
              <li><code>POST /api/tools/cookie-analyze</code>, <code>/id-inspect</code>, <code>/policy-lint</code>, <code>/format</code></li>
            </ul>
            <p>
              Conversion-specific docs:
            </p>
            <ul>
              <li><code>/api/tools/time-convert</code> accepts Unix, ISO8601, or wall-time input plus timezone lists.</li>
              <li>Timezone aliases are accepted, but output is normalized to IANA names like <code>Asia/Kolkata</code> and <code>America/New_York</code>.</li>
              <li><code>/api/tools/format</code> supports <code>mode: format|minify|validate</code> and structured conversion via <code>from</code>/<code>to</code>.</li>
              <li>Structured conversion currently supports <code>json</code>, <code>yaml</code>, and <code>toml</code>.</li>
            </ul>
            <p><code>POST /api/tools/time-convert</code> example body:</p>
            <pre><code>{
  "input": "2026-03-10T10:30:00",
  "sourceZone": "Asia/Kolkata",
  "zones": ["UTC", "Europe/Berlin", "Europe/Kyiv", "Pacific/Auckland", "Asia/Dubai"]
}</code></pre>
            <p><code>POST /api/tools/format</code> conversion example body:</p>
            <pre><code>{
  "input": "a = 1",
  "from": "toml",
  "to": "json",
  "mode": "format"
}</code></pre>
          </section>

          <section id="deployment" class="section">
            <h3>Deployment</h3>
            <p>
              Default manual deploy command: <code>pnpm run deploy</code>
            </p>
            <p>
              Primary domains: <code>hexyr.com</code> and <code>docs.hexyr.com</code>
            </p>
          </section>

          <section id="contributing" class="section">
            <h3>Contributing</h3>
            <p>
              Contributions are welcome. Run <code>pnpm lint</code>, <code>pnpm typecheck</code>,
              <code>pnpm test</code>, and <code>pnpm build</code> before opening a PR.
            </p>
            <p>
              For commit verification guidance, see <code>SIGNING.md</code> in the repository.
            </p>
          </section>
        </article>
      </div>
      <footer>
        <span>Local-first by default. No backend payload persistence.</span>
        <span>Need help? Open an issue on GitHub.</span>
      </footer>
    </main>
  </body>
</html>
`;
