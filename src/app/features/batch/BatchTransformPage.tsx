import { useMemo, useState } from 'react';
import { batchRowsToCsv, runBatchTransform, type BatchTransformKind } from '../../../shared/analysis';

const OPTIONS: BatchTransformKind[] = [
  'text-to-hex',
  'text-to-base64',
  'base64-to-text',
  'text-to-binary',
  'url-encode',
  'url-decode',
];

export function BatchTransformPage() {
  const [input, setInput] = useState('alpha\nbeta\ngamma');
  const [kind, setKind] = useState<BatchTransformKind>('text-to-hex');
  const rows = useMemo(() => runBatchTransform(input, kind), [input, kind]);

  return (
    <section className="animate-rise space-y-3">
      <h1 className="text-lg font-semibold text-slate-100">Batch Transform Mode</h1>
      <select className="focus-ring rounded border border-white/10 bg-surface-800 px-2 py-2 text-sm" value={kind} onChange={(e) => setKind(e.target.value as BatchTransformKind)}>
        {OPTIONS.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      <textarea className="focus-ring h-36 w-full resize-none rounded border border-white/10 bg-surface-900/60 p-3 font-mono text-sm" value={input} onChange={(event) => setInput(event.target.value)} />
      <pre className="glass max-h-64 overflow-auto rounded-md p-3 font-mono text-xs text-cyan-100">{JSON.stringify(rows, null, 2)}</pre>
      <pre className="glass max-h-40 overflow-auto rounded-md p-3 font-mono text-xs text-slate-300">{batchRowsToCsv(rows)}</pre>
    </section>
  );
}
