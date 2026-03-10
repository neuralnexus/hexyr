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
      main { max-width: 980px; margin: 0 auto; padding: 32px 20px 48px; }
      h1 { margin-top: 0; margin-bottom: 8px; font-size: 2rem; }
      p, li { color: #94a3b8; line-height: 1.5; }
      .grid { display: grid; gap: 14px; grid-template-columns: 1fr; }
      @media (min-width: 980px) { .grid { grid-template-columns: 2fr 1fr; } }
      .card {
        border: 1px solid rgba(255,255,255,.12);
        background: rgba(13,17,23,.88);
        border-radius: 12px;
        padding: 16px;
      }
      .card h2 { margin-top: 0; margin-bottom: 10px; }
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
        margin-top: 16px;
        color: #64748b;
        font-size: 12px;
      }
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
      <h1>Hexyr Documentation</h1>
      <p>Technical documentation for Hexyr, a local-first developer hex and encoding toolkit.</p>
      <div class="grid">
        <div class="card">
          <h2>Core Docs</h2>
          <ul>
            <li><a href="https://github.com/neuralnexus/hexyr/blob/main/docs/getting-started.md">Getting Started</a></li>
            <li><a href="https://github.com/neuralnexus/hexyr/blob/main/docs/tools.md">Tools Reference</a></li>
            <li><a href="https://github.com/neuralnexus/hexyr/blob/main/docs/privacy-security.md">Privacy and Security</a></li>
            <li><a href="https://github.com/neuralnexus/hexyr/blob/main/docs/api.md">API Reference</a></li>
            <li><a href="https://github.com/neuralnexus/hexyr/blob/main/docs/deployment.md">Deployment</a></li>
            <li><a href="https://github.com/neuralnexus/hexyr/blob/main/CONTRIBUTING.md">Contributing</a></li>
          </ul>
        </div>
        <div class="card">
          <h2>Quick Links</h2>
          <p><a href="https://hexyr.com">https://hexyr.com</a></p>
          <p><a href="https://github.com/neuralnexus/hexyr">GitHub Repository</a></p>
        </div>
      </div>
      <footer>Local-first by default. No backend payload persistence.</footer>
    </main>
  </body>
</html>
`;
