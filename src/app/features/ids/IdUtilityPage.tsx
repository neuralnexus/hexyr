import { useMemo, useState } from 'react';
import { generateKsuid, generateUlid, generateUuidV4, inspectId } from '../../../shared/parsing';

export function IdUtilityPage() {
  const [input, setInput] = useState('');
  const result = useMemo(() => inspectId(input), [input]);

  return (
    <section className="animate-rise space-y-3">
      <h1 className="text-lg font-semibold text-slate-100">UUID / ULID / KSUID Utility</h1>
      <div className="flex flex-wrap gap-2 text-sm">
        <button type="button" className="focus-ring rounded border border-white/10 bg-surface-800 px-3 py-2" onClick={() => setInput(generateUuidV4())}>Generate UUIDv4</button>
        <button type="button" className="focus-ring rounded border border-white/10 bg-surface-800 px-3 py-2" onClick={() => setInput(generateUlid())}>Generate ULID</button>
        <button type="button" className="focus-ring rounded border border-white/10 bg-surface-800 px-3 py-2" onClick={() => setInput(generateKsuid())}>Generate KSUID</button>
      </div>
      <input className="focus-ring w-full rounded border border-white/10 bg-surface-900/60 px-3 py-2 font-mono text-sm" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Paste UUID/ULID/KSUID" />
      <div className="glass rounded-md p-3 text-xs text-slate-300">
        <p>Type: {result.type}</p>
        <p>Valid: {result.valid ? 'yes' : 'no'}</p>
        {result.version !== undefined && <p>Version: {result.version}</p>}
        {result.timestampIso && <p>Timestamp: {result.timestampIso}</p>}
        {result.entropyScore !== undefined && <p>Entropy score: {result.entropyScore.toFixed(2)}</p>}
        {result.notes.length > 0 && <ul className="mt-2 list-disc space-y-1 pl-4 text-amber-300">{result.notes.map((n) => <li key={n}>{n}</li>)}</ul>}
      </div>
    </section>
  );
}
