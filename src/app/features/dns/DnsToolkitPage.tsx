import { useMemo, useState } from 'react';
import { formatZoneFile, parseZoneFile } from '../../../shared/parsing';

const EXAMPLE = `$ORIGIN example.com.
$TTL 300
@ IN A 192.0.2.1
www 60 IN CNAME @
mail 600 IN MX 10 mail.example.com.`;

export function DnsToolkitPage() {
  const [zone, setZone] = useState(EXAMPLE);
  const result = useMemo(() => parseZoneFile(zone), [zone]);

  return (
    <section className="animate-rise space-y-3">
      <h1 className="text-lg font-semibold text-slate-100">DNS Toolkit</h1>
      <textarea
        className="focus-ring h-44 w-full resize-none rounded border border-white/10 bg-surface-900/60 p-3 font-mono text-sm"
        value={zone}
        onChange={(event) => setZone(event.target.value)}
        placeholder="Paste zone file text"
      />
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className="focus-ring rounded border border-white/10 bg-surface-800 px-3 py-2 text-sm"
          onClick={() => setZone(formatZoneFile(result.records, result.origin, result.defaultTtl))}
        >
          Format Zone
        </button>
      </div>
      <section className="grid gap-3 lg:grid-cols-2">
        <div className="glass rounded-md p-3 text-xs">
          <h2 className="mb-2 uppercase tracking-[0.1em] text-slate-400">Validation</h2>
          {result.errors.length === 0 ? <p className="text-emerald-300">No syntax errors.</p> : <ul className="list-disc space-y-1 pl-4 text-red-300">{result.errors.map((x) => <li key={x}>{x}</li>)}</ul>}
          {result.warnings.length > 0 && <ul className="mt-2 list-disc space-y-1 pl-4 text-amber-300">{result.warnings.map((x) => <li key={x}>{x}</li>)}</ul>}
        </div>
        <div className="glass rounded-md p-3 text-xs text-slate-300">
          <h2 className="mb-2 uppercase tracking-[0.1em] text-slate-400">Records</h2>
          <p>Count: {result.records.length}</p>
          <p>Origin: {result.origin ?? '(none)'}</p>
          <p>Default TTL: {result.defaultTtl ?? '(none)'}</p>
        </div>
      </section>
    </section>
  );
}
