import { inspectJwt } from '../../../shared/parsing';
import { useWorkspace } from '../../hooks/useWorkspace';

export function JwtPage() {
  const { input, setInput } = useWorkspace();
  let result: ReturnType<typeof inspectJwt> | null = null;
  let error = '';

  if (input.trim()) {
    try {
      result = inspectJwt(input);
    } catch (err) {
      error = err instanceof Error ? err.message : 'Unable to parse token';
    }
  }

  return (
    <section className="animate-rise space-y-3">
      <header>
        <h1 className="text-lg font-semibold text-slate-100">JWT Inspector</h1>
        <p className="text-sm text-amber-300">Decode does not verify signature authenticity.</p>
      </header>

      <textarea
        className="focus-ring h-32 w-full resize-none rounded-md border border-white/10 bg-surface-900/60 p-3 font-mono text-sm"
        value={input}
        onChange={(event) => setInput(event.target.value)}
        placeholder="Paste JWT here"
      />

      {error ? (
        <div className="rounded-md border border-red-400/50 bg-red-500/10 p-3 text-sm text-red-200">{error}</div>
      ) : (
        result && (
          <div className="grid gap-3 lg:grid-cols-2">
            <JsonCard title="Header" value={result.headerJson} />
            <JsonCard title="Payload" value={result.payloadJson} />
            <section className="glass rounded-md p-3 lg:col-span-2">
              <h2 className="mb-2 text-xs uppercase tracking-[0.12em] text-slate-400">Warnings</h2>
              <ul className="list-disc space-y-1 pl-5 text-sm text-slate-300">
                {result.warnings.map((warning) => (
                  <li key={warning}>{warning}</li>
                ))}
              </ul>
            </section>
          </div>
        )
      )}
    </section>
  );
}

function JsonCard({ title, value }: { title: string; value: Record<string, unknown> | null }) {
  const highlightedKeys = ['alg', 'typ', 'exp', 'iss', 'aud', 'sub'];
  return (
    <section className="glass rounded-md p-3">
      <h2 className="mb-2 text-xs uppercase tracking-[0.12em] text-slate-400">{title}</h2>
      <pre className="max-h-72 overflow-auto rounded border border-white/10 bg-surface-900/40 p-2 font-mono text-xs text-cyan-100">
        {value ? JSON.stringify(value, null, 2) : 'Invalid JSON segment'}
      </pre>
      {value && (
        <div className="mt-2 flex flex-wrap gap-2 text-[11px]">
          {highlightedKeys
            .filter((key) => key in value)
            .map((key) => (
              <span key={key} className="rounded border border-cyan-300/40 bg-cyan-400/10 px-2 py-0.5 text-cyan-200">
                {key}: {String(value[key])}
              </span>
            ))}
        </div>
      )}
    </section>
  );
}
