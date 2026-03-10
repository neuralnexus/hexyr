import { useMemo, useState } from 'react';
import { inspectHar, redactHarForExport } from '../../../shared/parsing';

export function HarInspectorPage() {
  const [input, setInput] = useState('{"log":{"entries":[]}}');
  const [redacted, setRedacted] = useState('');

  const result = useMemo(() => {
    try {
      return inspectHar(input);
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Invalid HAR' };
    }
  }, [input]);

  return (
    <section className="animate-rise space-y-3">
      <h1 className="text-lg font-semibold text-slate-100">HAR Inspector</h1>
      <textarea className="focus-ring h-48 w-full resize-none rounded border border-white/10 bg-surface-900/60 p-3 font-mono text-xs" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Paste HAR JSON" />
      <button type="button" className="focus-ring rounded border border-white/10 bg-surface-800 px-3 py-2 text-sm" onClick={() => setRedacted(redactHarForExport(input))}>
        Build redacted export
      </button>
      {'error' in result ? (
        <div className="rounded border border-red-400/40 bg-red-500/10 p-2 text-sm text-red-300">{result.error}</div>
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          <div className="glass rounded-md p-3 text-xs text-slate-300">
            <p>Entries: {result.entryCount}</p>
            <p>Hosts: {result.hosts.length}</p>
            <p>Cookies seen: {result.cookies.length}</p>
            <p>Anomalies: {result.anomalies.length}</p>
          </div>
          <div className="glass rounded-md p-3 text-xs">
            <h2 className="mb-2 uppercase tracking-[0.1em] text-slate-400">Timing / Security anomalies</h2>
            {result.anomalies.length === 0 ? <p className="text-emerald-300">No anomalies detected.</p> : <ul className="list-disc space-y-1 pl-4 text-amber-300">{result.anomalies.slice(0, 20).map((a) => <li key={`${a.entryIndex}-${a.kind}-${a.message}`}>{a.message}</li>)}</ul>}
          </div>
        </div>
      )}
      {redacted && <pre className="glass max-h-56 overflow-auto rounded-md p-3 font-mono text-xs text-cyan-100">{redacted}</pre>}
    </section>
  );
}
