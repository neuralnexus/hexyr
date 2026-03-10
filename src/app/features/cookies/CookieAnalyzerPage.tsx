import { useMemo, useState } from 'react';
import { parseSetCookieHeaders } from '../../../shared/parsing';

export function CookieAnalyzerPage() {
  const [input, setInput] = useState('Set-Cookie: sid=abc123; Path=/; HttpOnly; Secure; SameSite=Lax');
  const result = useMemo(() => parseSetCookieHeaders(input), [input]);

  return (
    <section className="animate-rise space-y-3">
      <h1 className="text-lg font-semibold text-slate-100">Cookie / Jar Analyzer</h1>
      <textarea className="focus-ring h-40 w-full resize-none rounded border border-white/10 bg-surface-900/60 p-3 font-mono text-sm" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Paste Set-Cookie lines" />
      <div className="glass rounded-md p-3 text-xs">
        {result.errors.length > 0 && <ul className="mb-2 list-disc space-y-1 pl-4 text-red-300">{result.errors.map((e) => <li key={e}>{e}</li>)}</ul>}
        {result.cookies.map((cookie) => (
          <div key={cookie.name} className="mb-2 rounded border border-white/10 p-2">
            <div className="font-mono text-slate-200">{cookie.name}</div>
            {cookie.warnings.length === 0 ? <p className="text-emerald-300">No warnings</p> : <ul className="list-disc space-y-1 pl-4 text-amber-300">{cookie.warnings.map((w) => <li key={w}>{w}</li>)}</ul>}
          </div>
        ))}
      </div>
    </section>
  );
}
