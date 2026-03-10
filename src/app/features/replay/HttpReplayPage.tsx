import { useMemo } from 'react';
import { parseHttpReplayTemplate } from '../../../shared/parsing';
import { useWorkspace } from '../../hooks/useWorkspace';

export function HttpReplayPage() {
  const { input, setInput } = useWorkspace();
  const result = useMemo(() => {
    try {
      return parseHttpReplayTemplate(input || 'GET / HTTP/1.1\nHost: example.com\n\n');
    } catch {
      return null;
    }
  }, [input]);

  return (
    <section className="animate-rise space-y-3">
      <h1 className="text-lg font-semibold text-slate-100">HTTP Request Replay Builder</h1>
      <textarea
        className="focus-ring h-40 w-full resize-none rounded border border-white/10 bg-surface-900/60 p-3 font-mono text-sm"
        value={input}
        onChange={(event) => setInput(event.target.value)}
        placeholder="Paste raw HTTP request or curl command"
      />
      {result ? (
        <div className="grid gap-3 lg:grid-cols-2">
          <pre className="glass max-h-72 overflow-auto rounded-md p-3 font-mono text-xs text-cyan-100">{result.fetchTemplate}</pre>
          <pre className="glass max-h-72 overflow-auto rounded-md p-3 font-mono text-xs text-cyan-100">{result.curlTemplate}</pre>
        </div>
      ) : (
        <p className="text-sm text-red-300">Unable to parse request format.</p>
      )}
    </section>
  );
}
