import { useMemo } from 'react';
import { redactSensitiveText } from '../../../shared/analysis';
import { useWorkspace } from '../../hooks/useWorkspace';

export function RedactionPage() {
  const { input, setInput } = useWorkspace();
  const result = useMemo(() => redactSensitiveText(input), [input]);

  return (
    <section className="animate-rise space-y-3">
      <h1 className="text-lg font-semibold text-slate-100">Token/Secret Redaction Mode</h1>
      <textarea
        className="focus-ring h-40 w-full resize-none rounded border border-white/10 bg-surface-900/60 p-3 font-mono text-sm"
        value={input}
        onChange={(event) => setInput(event.target.value)}
        placeholder="Paste logs, JWTs, emails, IPs, API keys"
      />
      <div className="glass rounded-md p-3 text-xs text-slate-300">
        <div>JWT: {result.counts.jwt}</div>
        <div>Email: {result.counts.email}</div>
        <div>IPv4: {result.counts.ipv4}</div>
        <div>API keys: {result.counts.apiKey}</div>
      </div>
      <pre className="glass max-h-[48vh] overflow-auto rounded-md p-3 font-mono text-xs text-cyan-100">
        {result.redactedText}
      </pre>
    </section>
  );
}
