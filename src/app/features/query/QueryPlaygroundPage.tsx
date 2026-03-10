import { useMemo, useState } from 'react';
import { runJmesPath, runJsonPath } from '../../../shared/parsing';
import { useWorkspace } from '../../hooks/useWorkspace';

export function QueryPlaygroundPage() {
  const { input, setInput } = useWorkspace();
  const [jsonPath, setJsonPath] = useState('$.items.*.id');
  const [jmes, setJmes] = useState('items.*.id');

  const jsonPathOutput = useMemo(() => {
    if (!input.trim()) return 'Paste JSON input';
    try {
      return JSON.stringify(runJsonPath(input, jsonPath), null, 2);
    } catch (err) {
      return err instanceof Error ? `Error: ${err.message}` : 'Error running JSONPath';
    }
  }, [input, jsonPath]);

  const jmesOutput = useMemo(() => {
    if (!input.trim()) return 'Paste JSON input';
    try {
      return JSON.stringify(runJmesPath(input, jmes), null, 2);
    } catch (err) {
      return err instanceof Error ? `Error: ${err.message}` : 'Error running JMESPath-like query';
    }
  }, [input, jmes]);

  return (
    <section className="animate-rise space-y-3">
      <header>
        <h1 className="text-lg font-semibold text-slate-100">JSONPath and JMESPath Playground</h1>
        <p className="text-sm text-slate-400">Query JSON payloads quickly with deterministic in-browser evaluation.</p>
      </header>

      <textarea
        className="focus-ring h-40 w-full resize-none rounded-md border border-white/10 bg-surface-900/60 p-3 font-mono text-sm"
        value={input}
        onChange={(event) => setInput(event.target.value)}
        placeholder='{"items": [{"id": 1}, {"id": 2}]}'
      />

      <div className="grid gap-3 lg:grid-cols-2">
        <section className="glass rounded-md p-3">
          <label className="mb-2 block text-xs uppercase tracking-[0.12em] text-slate-400">JSONPath</label>
          <input
            className="focus-ring w-full rounded border border-white/10 bg-surface-800 px-2 py-2 font-mono text-sm"
            value={jsonPath}
            onChange={(event) => setJsonPath(event.target.value)}
          />
          <pre className="mt-2 max-h-64 overflow-auto rounded border border-white/10 bg-surface-900/40 p-2 font-mono text-xs text-cyan-100">
            {jsonPathOutput}
          </pre>
        </section>

        <section className="glass rounded-md p-3">
          <label className="mb-2 block text-xs uppercase tracking-[0.12em] text-slate-400">JMESPath-style</label>
          <input
            className="focus-ring w-full rounded border border-white/10 bg-surface-800 px-2 py-2 font-mono text-sm"
            value={jmes}
            onChange={(event) => setJmes(event.target.value)}
          />
          <pre className="mt-2 max-h-64 overflow-auto rounded border border-white/10 bg-surface-900/40 p-2 font-mono text-xs text-cyan-100">
            {jmesOutput}
          </pre>
        </section>
      </div>
    </section>
  );
}
