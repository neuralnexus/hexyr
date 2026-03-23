import { useEffect, useState } from 'react';
import { hashText, hmacText, type HashAlgorithm } from '../../../shared/crypto';
import { useWorkspace } from '../../hooks/useWorkspace';

const ALGORITHMS: HashAlgorithm[] = ['MD5', 'SHA-1', 'SHA-256', 'SHA-384', 'SHA-512'];

export function HashPage() {
  const { input, setInput } = useWorkspace();
  const [algorithm, setAlgorithm] = useState<HashAlgorithm>('SHA-256');
  const [key, setKey] = useState('');
  const [digest, setDigest] = useState('');
  const [hmac, setHmac] = useState('');

  useEffect(() => {
    let mounted = true;
    async function run() {
      const nextDigest = await hashText(input, algorithm);
      const nextHmac =
        key && algorithm !== 'MD5' && algorithm !== 'SHA-1'
          ? await hmacText(input, key, algorithm)
          : '';
      if (mounted) {
        setDigest(nextDigest);
        setHmac(nextHmac);
      }
    }
    if (input) {
      void run();
    }
    return () => {
      mounted = false;
    };
  }, [algorithm, input, key]);

  return (
    <section className="animate-rise space-y-3">
      <header>
        <h1 className="text-lg font-semibold text-slate-100">Hash and HMAC</h1>
        <p className="text-sm text-slate-400">
          Uses Web Crypto APIs for deterministic client-side hashing.
        </p>
      </header>

      <textarea
        className="focus-ring h-36 w-full resize-none rounded-md border border-white/10 bg-surface-900/60 p-3 font-mono text-sm"
        value={input}
        onChange={(event) => setInput(event.target.value)}
        placeholder="Input payload"
      />

      <div className="grid gap-3 md:grid-cols-2">
        <label className="glass rounded-md p-3 text-sm">
          <span className="mb-1 block text-xs uppercase tracking-[0.12em] text-slate-400">
            Algorithm
          </span>
          <select
            className="focus-ring w-full rounded border border-white/10 bg-surface-800 px-2 py-2"
            value={algorithm}
            onChange={(event) => setAlgorithm(event.target.value as HashAlgorithm)}
          >
            {ALGORITHMS.map((algo) => (
              <option key={algo} value={algo}>
                {algo}
              </option>
            ))}
          </select>
        </label>
        <label className="glass rounded-md p-3 text-sm">
          <span className="mb-1 block text-xs uppercase tracking-[0.12em] text-slate-400">
            HMAC Key
          </span>
          <input
            className="focus-ring w-full rounded border border-white/10 bg-surface-800 px-2 py-2 font-mono"
            value={key}
            onChange={(event) => setKey(event.target.value)}
            placeholder="Optional shared secret"
          />
        </label>
      </div>

      <Output title="Digest" value={input ? digest : ''} />
      <Output
        title="HMAC"
        value={
          algorithm === 'MD5' || algorithm === 'SHA-1'
            ? 'HMAC is available for SHA-256/384/512. Select one of those algorithms.'
            : input
              ? hmac || 'Provide key to calculate HMAC'
              : ''
        }
      />
      <p className="text-xs text-amber-300">
        MD5 is available for legacy compatibility. Avoid using it for modern cryptographic security.
      </p>
    </section>
  );
}

function Output({ title, value }: { title: string; value: string }) {
  return (
    <section className="glass rounded-md p-3">
      <h2 className="mb-2 text-xs uppercase tracking-[0.12em] text-slate-400">{title}</h2>
      <pre className="overflow-auto rounded border border-white/10 bg-surface-900/40 p-2 font-mono text-xs text-cyan-100">
        {value}
      </pre>
    </section>
  );
}
