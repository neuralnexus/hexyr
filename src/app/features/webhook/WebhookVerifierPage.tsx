import { useState } from 'react';
import { verifyWebhookSignature, type WebhookProvider, type WebhookVerifyResult } from '../../../shared/crypto';

export function WebhookVerifierPage() {
  const [provider, setProvider] = useState<WebhookProvider>('stripe');
  const [payload, setPayload] = useState('{"event":"ping"}');
  const [secret, setSecret] = useState('whsec_test');
  const [signatureHeader, setSignatureHeader] = useState('t=1700000000,v1=deadbeef');
  const [timestampHeader, setTimestampHeader] = useState('1700000000');
  const [result, setResult] = useState<WebhookVerifyResult | null>(null);
  const [error, setError] = useState('');

  const run = async () => {
    try {
      const next = await verifyWebhookSignature({ provider, payload, secret, signatureHeader, timestampHeader });
      setResult(next);
      setError('');
    } catch (err) {
      setResult(null);
      setError(err instanceof Error ? err.message : 'Verification failed');
    }
  };

  return (
    <section className="animate-rise space-y-3">
      <h1 className="text-lg font-semibold text-slate-100">Webhook Signature Verifier</h1>
      <div className="flex flex-wrap gap-2">
        <select className="focus-ring rounded border border-white/10 bg-surface-800 px-2 py-2 text-sm" value={provider} onChange={(e) => setProvider(e.target.value as WebhookProvider)}>
          <option value="stripe">Stripe</option>
          <option value="github">GitHub</option>
          <option value="slack">Slack</option>
        </select>
        <button type="button" className="focus-ring rounded border border-white/10 bg-surface-800 px-3 py-2 text-sm" onClick={() => void run()}>
          Verify
        </button>
      </div>
      <input className="focus-ring w-full rounded border border-white/10 bg-surface-900/60 px-3 py-2 font-mono text-sm" value={secret} onChange={(e) => setSecret(e.target.value)} placeholder="Webhook secret" />
      <input className="focus-ring w-full rounded border border-white/10 bg-surface-900/60 px-3 py-2 font-mono text-sm" value={signatureHeader} onChange={(e) => setSignatureHeader(e.target.value)} placeholder="Signature header" />
      {provider === 'slack' && <input className="focus-ring w-full rounded border border-white/10 bg-surface-900/60 px-3 py-2 font-mono text-sm" value={timestampHeader} onChange={(e) => setTimestampHeader(e.target.value)} placeholder="X-Slack-Request-Timestamp" />}
      <textarea className="focus-ring h-36 w-full resize-none rounded border border-white/10 bg-surface-900/60 p-3 font-mono text-sm" value={payload} onChange={(e) => setPayload(e.target.value)} placeholder="Raw request body payload" />
      {error && <div className="rounded border border-red-400/40 bg-red-500/10 p-2 text-sm text-red-300">{error}</div>}
      {result && (
        <div className="glass rounded-md p-3 text-sm">
          <p className={result.valid ? 'text-emerald-300' : 'text-red-300'}>{result.valid ? 'Signature valid' : 'Signature mismatch'}</p>
          <p className="text-xs text-slate-400">Algorithm: {result.algorithm}</p>
          <p className="mt-1 break-all font-mono text-xs text-cyan-100">Expected: {result.expected}</p>
          <p className="mt-1 break-all font-mono text-xs text-slate-300">Received: {result.received}</p>
        </div>
      )}
    </section>
  );
}
