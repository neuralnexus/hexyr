import { useMemo, useState } from 'react';
import { lintHttpPolicies } from '../../../shared/parsing';

const SAMPLE = `HTTP/1.1 200 OK
content-type: text/html
access-control-allow-origin: *
access-control-allow-credentials: true`;

export function PolicyLinterPage() {
  const [input, setInput] = useState(SAMPLE);
  const result = useMemo(() => lintHttpPolicies(input), [input]);

  return (
    <section className="animate-rise space-y-3">
      <h1 className="text-lg font-semibold text-slate-100">Policy Linter Pack</h1>
      <textarea className="focus-ring h-40 w-full resize-none rounded border border-white/10 bg-surface-900/60 p-3 font-mono text-sm" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Paste HTTP response headers" />
      <div className="glass rounded-md p-3 text-xs">
        <p className="mb-2 text-slate-400">Issues found: {result.issues.length}</p>
        {result.issues.length === 0 ? (
          <p className="text-emerald-300">No policy issues detected.</p>
        ) : (
          <ul className="list-disc space-y-1 pl-4 text-amber-300">
            {result.issues.map((issue, i) => (
              <li key={`${issue.area}-${i}`}>
                [{issue.area}] {issue.message}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
