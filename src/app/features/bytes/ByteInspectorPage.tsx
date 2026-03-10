import { useMemo } from 'react';
import { inspectBytes } from '../../../shared/analysis';
import { useWorkspace } from '../../hooks/useWorkspace';

export function ByteInspectorPage() {
  const { input, setInput } = useWorkspace();
  const result = useMemo(() => inspectBytes(input), [input]);

  return (
    <section className="animate-rise space-y-3">
      <header>
        <h1 className="text-lg font-semibold text-slate-100">CBOR/MessagePack/Protobuf Inspector</h1>
        <p className="text-sm text-slate-400">Heuristic byte-level inspection for common compact binary formats.</p>
      </header>

      <textarea
        className="focus-ring h-36 w-full resize-none rounded-md border border-white/10 bg-surface-900/60 p-3 font-mono text-sm"
        value={input}
        onChange={(event) => setInput(event.target.value)}
        placeholder="Paste hex, base64, or text bytes"
      />

      <div className="grid gap-3 lg:grid-cols-3">
        <Card title="CBOR" lines={result.cbor} />
        <Card title="MessagePack" lines={result.messagePack} />
        <Card title="Protobuf" lines={result.protobuf} />
      </div>
    </section>
  );
}

function Card({ title, lines }: { title: string; lines: string[] }) {
  return (
    <section className="glass rounded-md p-3">
      <h2 className="mb-2 text-xs uppercase tracking-[0.12em] text-slate-400">{title}</h2>
      <pre className="max-h-72 overflow-auto rounded border border-white/10 bg-surface-900/40 p-2 font-mono text-xs text-cyan-100">
        {lines.join('\n')}
      </pre>
    </section>
  );
}
