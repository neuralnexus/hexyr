import { useEffect, useState } from 'react';
import { inspectCertificatePem, type CertificateInfo } from '../../../shared/parsing';
import { useWorkspace } from '../../hooks/useWorkspace';

export function CertInspectorPage() {
  const { input, setInput } = useWorkspace();
  const [certs, setCerts] = useState<CertificateInfo[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    async function run() {
      if (!input.trim()) {
        setCerts([]);
        setError('');
        return;
      }
      try {
        const parsed = await inspectCertificatePem(input);
        if (mounted) {
          setCerts(parsed);
          setError('');
        }
      } catch (err) {
        if (mounted) {
          setCerts([]);
          setError(err instanceof Error ? err.message : 'Unable to parse certificate input');
        }
      }
    }
    void run();
    return () => {
      mounted = false;
    };
  }, [input]);

  return (
    <section className="animate-rise space-y-3">
      <header>
        <h1 className="text-lg font-semibold text-slate-100">PEM and X.509 Inspector</h1>
        <p className="text-sm text-slate-400">
          Parse PEM certificate chains, extract SAN/validity metadata, and compute fingerprints.
        </p>
      </header>

      <textarea
        className="focus-ring h-44 w-full resize-none rounded-md border border-white/10 bg-surface-900/60 p-3 font-mono text-sm"
        value={input}
        onChange={(event) => setInput(event.target.value)}
        placeholder="Paste one or more -----BEGIN CERTIFICATE----- blocks"
      />

      {error && <div className="rounded-md border border-red-400/40 bg-red-500/10 p-3 text-sm text-red-300">{error}</div>}

      <div className="space-y-3">
        {certs.map((cert, idx) => (
          <section key={idx} className="glass rounded-md p-3 text-sm">
            <h2 className="mb-2 text-xs uppercase tracking-[0.12em] text-slate-400">Certificate {idx + 1}</h2>
            <div className="grid gap-2 md:grid-cols-2">
              <Item label="Subject CN" value={cert.subjectCommonName ?? 'N/A'} />
              <Item label="Issuer CN" value={cert.issuerCommonName ?? 'N/A'} />
              <Item label="Not Before" value={cert.notBefore ?? 'N/A'} />
              <Item label="Not After" value={cert.notAfter ?? 'N/A'} />
            </div>
            <div className="mt-3 grid gap-2 md:grid-cols-3">
              <Item label="SAN DNS" value={cert.sanDns.join(', ') || 'N/A'} />
              <Item label="SAN IP" value={cert.sanIp.join(', ') || 'N/A'} />
              <Item label="SAN Email" value={cert.sanEmail.join(', ') || 'N/A'} />
            </div>
            <div className="mt-3 space-y-2">
              <Item label="SHA-256" value={cert.sha256} mono />
              <Item label="SHA-1" value={cert.sha1} mono />
            </div>
          </section>
        ))}
      </div>
    </section>
  );
}

function Item({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="rounded border border-white/10 bg-surface-900/40 px-2 py-1.5">
      <div className="text-[11px] uppercase tracking-[0.1em] text-slate-400">{label}</div>
      <div className={mono ? 'mt-1 font-mono text-xs text-cyan-100' : 'mt-1 text-slate-200'}>{value}</div>
    </div>
  );
}
