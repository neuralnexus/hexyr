import { useMemo, useState } from 'react';
import { comparePayloads, type DiffEncoding } from '../../../shared/analysis';

export function DiffPage() {
  const [left, setLeft] = useState('48656c6c6f');
  const [right, setRight] = useState('48656c7051');
  const [encoding, setEncoding] = useState<DiffEncoding>('hex');

  const result = useMemo(() => comparePayloads(left, right, encoding), [left, right, encoding]);

  return (
    <section className="animate-rise space-y-3">
      <header>
        <h1 className="text-lg font-semibold text-slate-100">Payload Diff Mode</h1>
        <p className="text-sm text-slate-400">Compare two payloads side-by-side in text, hex, or base64 representations.</p>
      </header>

      <div className="glass rounded-md p-3">
        <label className="text-xs uppercase tracking-[0.12em] text-slate-400">Encoding</label>
        <select
          className="focus-ring ml-2 rounded border border-white/10 bg-surface-800 px-2 py-1 text-sm"
          value={encoding}
          onChange={(event) => setEncoding(event.target.value as DiffEncoding)}
        >
          <option value="text">Text</option>
          <option value="hex">Hex</option>
          <option value="base64">Base64</option>
        </select>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <textarea
          className="focus-ring h-48 w-full resize-none rounded-md border border-white/10 bg-surface-900/60 p-3 font-mono text-sm"
          value={left}
          onChange={(event) => setLeft(event.target.value)}
          placeholder="Left payload"
        />
        <textarea
          className="focus-ring h-48 w-full resize-none rounded-md border border-white/10 bg-surface-900/60 p-3 font-mono text-sm"
          value={right}
          onChange={(event) => setRight(event.target.value)}
          placeholder="Right payload"
        />
      </div>

      <section className="glass rounded-md p-3 text-sm">
        <div className="grid gap-2 md:grid-cols-4">
          <Stat label="Left bytes" value={String(result.leftLength)} />
          <Stat label="Right bytes" value={String(result.rightLength)} />
          <Stat label="Equal bytes" value={String(result.equalBytes)} />
          <Stat label="Similarity" value={`${(result.similarity * 100).toFixed(2)}%`} />
        </div>
        <p className="mt-3 text-xs text-slate-400">First differing offset: {result.firstDiffOffset}</p>
        <pre className="mt-2 max-h-52 overflow-auto rounded border border-white/10 bg-surface-900/40 p-2 font-mono text-xs text-cyan-100">
          {result.preview.join('\n') || 'No preview'}
        </pre>
      </section>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border border-white/10 px-2 py-1">
      <div className="text-xs uppercase tracking-[0.1em] text-slate-400">{label}</div>
      <div className="font-mono text-cyan-100">{value}</div>
    </div>
  );
}
