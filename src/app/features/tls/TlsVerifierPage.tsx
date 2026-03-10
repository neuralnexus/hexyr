import { useEffect, useState } from 'react';
import { verifyTlsChainPem, type TlsChainReport } from '../../../shared/parsing';
import { useWorkspace } from '../../hooks/useWorkspace';

export function TlsVerifierPage() {
  const { input, setInput } = useWorkspace();
  const [hostname, setHostname] = useState('example.com');
  const [report, setReport] = useState<TlsChainReport | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    async function run() {
      if (!input.trim()) {
        setReport(null);
        setError('');
        return;
      }
      try {
        const next = await verifyTlsChainPem(input, hostname);
        if (mounted) {
          setReport(next);
          setError('');
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Failed to verify certificate chain');
          setReport(null);
        }
      }
    }
    void run();
    return () => {
      mounted = false;
    };
  }, [hostname, input]);

  return (
    <section className="animate-rise space-y-3">
      <h1 className="text-lg font-semibold text-slate-100">TLS/Cert Chain Verifier</h1>
      <input
        className="focus-ring w-full rounded border border-white/10 bg-surface-800 px-3 py-2 font-mono text-sm"
        value={hostname}
        onChange={(event) => setHostname(event.target.value)}
        placeholder="Hostname for leaf cert match"
      />
      <textarea
        className="focus-ring h-36 w-full resize-none rounded border border-white/10 bg-surface-900/60 p-3 font-mono text-sm"
        value={input}
        onChange={(event) => setInput(event.target.value)}
        placeholder="Paste PEM certificate chain"
      />
      {error && <div className="rounded border border-red-400/40 bg-red-500/10 p-2 text-sm text-red-300">{error}</div>}
      {report && (
        <section className="glass rounded-md p-3 text-sm">
          <p>Chain linked: {report.chainLooksLinked ? 'yes' : 'no'}</p>
          {report.warnings.length > 0 && (
            <ul className="mt-2 list-disc pl-5 text-amber-300">
              {report.warnings.map((w) => (
                <li key={w}>{w}</li>
              ))}
            </ul>
          )}
          <div className="mt-3 space-y-2">
            {report.certificates.map((cert) => (
              <div key={cert.index} className="rounded border border-white/10 p-2">
                <div className="font-semibold text-slate-200">Cert {cert.index + 1}</div>
                <div className="text-xs text-slate-400">Subject: {cert.subject ?? 'N/A'}</div>
                <div className="text-xs text-slate-400">Issuer: {cert.issuer ?? 'N/A'}</div>
                <div className="text-xs text-slate-400">Hostname match: {cert.hostnameMatch ? 'yes' : 'no'}</div>
                <div className="text-xs text-slate-400">Expiry: {cert.notAfter ?? 'N/A'}</div>
              </div>
            ))}
          </div>
        </section>
      )}
    </section>
  );
}
