import { useWorkspace } from '../../hooks/useWorkspace';
import { inspectUnicode } from '../../../shared/encoding';

export function UnicodePage() {
  const { input, setInput } = useWorkspace();
  const result = inspectUnicode(input);

  return (
    <section className="animate-rise space-y-3">
      <header>
        <h1 className="text-lg font-semibold text-slate-100">Unicode Inspector</h1>
        <p className="text-sm text-slate-400">Inspect code points, UTF-8 bytes, and UTF-16 units.</p>
      </header>

      <label className="glass block rounded-md p-3">
        <div className="mb-2 text-xs uppercase tracking-[0.12em] text-slate-400">Input</div>
        <textarea
          className="focus-ring h-40 w-full resize-none rounded-md border border-white/10 bg-surface-900/60 p-3 font-mono text-sm"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Type Unicode text"
        />
      </label>

      <div className="grid gap-3 lg:grid-cols-3">
        <InspectCard title="Code Points" rows={result.codePoints} />
        <InspectCard title="UTF-8 Bytes" rows={result.utf8Bytes} />
        <InspectCard title="UTF-16 Units" rows={result.utf16Units} />
      </div>
    </section>
  );
}

function InspectCard({ title, rows }: { title: string; rows: string[] }) {
  return (
    <section className="glass rounded-md p-3">
      <h2 className="mb-2 text-xs uppercase tracking-[0.12em] text-slate-400">{title}</h2>
      <pre className="max-h-48 overflow-auto whitespace-pre-wrap font-mono text-xs text-cyan-100">
        {rows.join('\n') || 'No content'}
      </pre>
    </section>
  );
}
