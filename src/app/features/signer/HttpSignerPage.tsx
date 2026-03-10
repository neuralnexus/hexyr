import { useEffect, useState } from 'react';
import { hmacSign, signAwsSigV4, type HmacAlgorithm } from '../../../shared/crypto';

const HMAC_ALGOS: HmacAlgorithm[] = ['SHA-256', 'SHA-384', 'SHA-512'];

export function HttpSignerPage() {
  const [message, setMessage] = useState('GET\n/api/health\n');
  const [key, setKey] = useState('replace-me');
  const [algo, setAlgo] = useState<HmacAlgorithm>('SHA-256');
  const [hmacHex, setHmacHex] = useState('');
  const [hmacB64, setHmacB64] = useState('');

  const [method, setMethod] = useState('GET');
  const [url, setUrl] = useState('https://example.amazonaws.com/');
  const [region, setRegion] = useState('us-east-1');
  const [service, setService] = useState('execute-api');
  const [accessKeyId, setAccessKeyId] = useState('AKIDEXAMPLE');
  const [secretAccessKey, setSecretAccessKey] = useState('wJalrXUtnFEMI/K7MDENG+bPxRfiCYEXAMPLEKEY');
  const [payload, setPayload] = useState('');
  const [sigV4, setSigV4] = useState('');

  useEffect(() => {
    let mounted = true;
    async function run() {
      const signed = await hmacSign(message, key, algo);
      if (mounted) {
        setHmacHex(signed.hex);
        setHmacB64(signed.base64);
      }
    }
    if (message && key) {
      void run();
    }
    return () => {
      mounted = false;
    };
  }, [algo, key, message]);

  useEffect(() => {
    let mounted = true;
    async function run() {
      try {
        const signed = await signAwsSigV4({
          method,
          url,
          region,
          service,
          accessKeyId,
          secretAccessKey,
          payload,
        });
        if (mounted) {
          setSigV4(`${signed.authorizationHeader}\n\nx-amz-date: ${signed.amzDate}`);
        }
      } catch (err) {
        if (mounted) {
          setSigV4(err instanceof Error ? `Error: ${err.message}` : 'Error creating SigV4 signature');
        }
      }
    }
    if (url && accessKeyId && secretAccessKey) {
      void run();
    }
    return () => {
      mounted = false;
    };
  }, [accessKeyId, method, payload, region, secretAccessKey, service, url]);

  return (
    <section className="animate-rise space-y-3">
      <header>
        <h1 className="text-lg font-semibold text-slate-100">HTTP Request Signer</h1>
        <p className="text-sm text-slate-400">Generate HMAC signatures and AWS SigV4 authorization headers locally.</p>
      </header>

      <div className="grid gap-3 xl:grid-cols-2">
        <section className="glass rounded-md p-3 space-y-2">
          <h2 className="text-xs uppercase tracking-[0.12em] text-slate-400">HMAC Schemes</h2>
          <select
            className="focus-ring w-full rounded border border-white/10 bg-surface-800 px-2 py-2"
            value={algo}
            onChange={(event) => setAlgo(event.target.value as HmacAlgorithm)}
          >
            {HMAC_ALGOS.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
          <input
            className="focus-ring w-full rounded border border-white/10 bg-surface-800 px-2 py-2 font-mono text-sm"
            value={key}
            onChange={(event) => setKey(event.target.value)}
            placeholder="Shared secret"
          />
          <textarea
            className="focus-ring h-28 w-full resize-none rounded border border-white/10 bg-surface-900/60 p-2 font-mono text-sm"
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            placeholder="Message to sign"
          />
          <Output title="HMAC hex" value={hmacHex} />
          <Output title="HMAC base64" value={hmacB64} />
        </section>

        <section className="glass rounded-md p-3 space-y-2">
          <h2 className="text-xs uppercase tracking-[0.12em] text-slate-400">AWS SigV4</h2>
          <div className="grid gap-2 md:grid-cols-2">
            <input className="focus-ring rounded border border-white/10 bg-surface-800 px-2 py-2 font-mono text-sm" value={method} onChange={(e) => setMethod(e.target.value)} placeholder="Method" />
            <input className="focus-ring rounded border border-white/10 bg-surface-800 px-2 py-2 font-mono text-sm" value={region} onChange={(e) => setRegion(e.target.value)} placeholder="Region" />
            <input className="focus-ring rounded border border-white/10 bg-surface-800 px-2 py-2 font-mono text-sm" value={service} onChange={(e) => setService(e.target.value)} placeholder="Service" />
            <input className="focus-ring rounded border border-white/10 bg-surface-800 px-2 py-2 font-mono text-sm" value={accessKeyId} onChange={(e) => setAccessKeyId(e.target.value)} placeholder="Access key ID" />
          </div>
          <input
            className="focus-ring w-full rounded border border-white/10 bg-surface-800 px-2 py-2 font-mono text-sm"
            value={secretAccessKey}
            onChange={(event) => setSecretAccessKey(event.target.value)}
            placeholder="Secret access key"
          />
          <input
            className="focus-ring w-full rounded border border-white/10 bg-surface-800 px-2 py-2 font-mono text-sm"
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            placeholder="Request URL"
          />
          <textarea
            className="focus-ring h-24 w-full resize-none rounded border border-white/10 bg-surface-900/60 p-2 font-mono text-sm"
            value={payload}
            onChange={(event) => setPayload(event.target.value)}
            placeholder="Request payload"
          />
          <Output title="Authorization header" value={sigV4} />
        </section>
      </div>
    </section>
  );
}

function Output({ title, value }: { title: string; value: string }) {
  return (
    <div>
      <div className="mb-1 text-[11px] uppercase tracking-[0.1em] text-slate-400">{title}</div>
      <pre className="max-h-28 overflow-auto rounded border border-white/10 bg-surface-900/40 p-2 font-mono text-xs text-cyan-100">{value || 'N/A'}</pre>
    </div>
  );
}
