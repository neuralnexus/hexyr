import { useMemo, useState } from 'react';
import { extractStructuredWithRegex } from '../../../shared/parsing';
import { useWorkspace } from '../../hooks/useWorkspace';

export function RegexExtractorPage() {
  const { input, setInput } = useWorkspace();
  const [pattern, setPattern] = useState('user=(?<user>\\w+) ip=(?<ip>[0-9.]+)');
  const [flags, setFlags] = useState('gm');

  const result = useMemo(() => extractStructuredWithRegex(input, pattern, flags), [flags, input, pattern]);

  return (
    <section className="animate-rise space-y-3">
      <h1 className="text-lg font-semibold text-slate-100">Regex + Structured Extractor</h1>
      <textarea
        className="focus-ring h-36 w-full resize-none rounded border border-white/10 bg-surface-900/60 p-3 font-mono text-sm"
        value={input}
        onChange={(event) => setInput(event.target.value)}
        placeholder="user=alice ip=10.0.0.1"
      />
      <div className="grid gap-2 md:grid-cols-[1fr_120px]">
        <input className="focus-ring rounded border border-white/10 bg-surface-800 px-2 py-2 font-mono text-sm" value={pattern} onChange={(e) => setPattern(e.target.value)} />
        <input className="focus-ring rounded border border-white/10 bg-surface-800 px-2 py-2 font-mono text-sm" value={flags} onChange={(e) => setFlags(e.target.value)} />
      </div>
      {result.errors.length > 0 && <div className="rounded border border-amber-400/40 bg-amber-500/10 p-2 text-xs text-amber-300">{result.errors.join(' | ')}</div>}
      <pre className="glass max-h-64 overflow-auto rounded-md p-3 font-mono text-xs text-cyan-100">
        {JSON.stringify(result.matches, null, 2)}
      </pre>
    </section>
  );
}
