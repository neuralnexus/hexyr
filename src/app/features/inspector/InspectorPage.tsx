import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  base64PaddingStatus,
  base64UrlHint,
  bytesFromBestEffort,
  detectMagicBytes,
  estimateEntropy,
} from '../../../shared/analysis';
import { detectFormats } from '../../../shared/detection';
import { explainHexDump } from '../../../shared/explainers';
import { useWorkspace } from '../../hooks/useWorkspace';

const ROUTE_FOR_FORMAT: Record<string, string> = {
  hex: '/tool/hex',
  base64: '/tool/base64',
  base64url: '/tool/base64',
  binary: '/tool/binary',
  jwt: '/tool/jwt',
  urlencoded: '/tool/url',
  json: '/tool/hex',
  text: '/tool/hex',
};

export function InspectorPage() {
  const { input, setInput } = useWorkspace();
  const navigate = useNavigate();

  const candidates = useMemo(() => detectFormats(input), [input]);
  const bytes = useMemo(() => bytesFromBestEffort(input), [input]);
  const entropy = useMemo(() => estimateEntropy(bytes), [bytes]);
  const magic = useMemo(() => detectMagicBytes(bytes), [bytes]);

  return (
    <section className="animate-rise space-y-3">
      <header>
        <h1 className="text-lg font-semibold text-slate-100">Universal Inspector</h1>
        <p className="text-sm text-slate-400">
          Paste or drop unknown payloads and Hexyr suggests how to decode, inspect, and validate.
        </p>
      </header>

      <div
        className="glass rounded-md p-3"
        onDrop={async (event) => {
          event.preventDefault();
          const file = event.dataTransfer.files[0];
          if (!file) return;
          const text = await file.text();
          setInput(text);
        }}
        onDragOver={(event) => event.preventDefault()}
      >
        <textarea
          className="focus-ring h-[48vh] w-full resize-none rounded-md border border-white/10 bg-surface-900/60 p-3 font-mono text-sm text-slate-100"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Paste anything here: JWT, base64, hex, JSON, URL-encoded text, or file content"
        />
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <section className="glass rounded-md p-3">
          <h2 className="mb-2 text-xs uppercase tracking-[0.12em] text-slate-400">Likely Formats</h2>
          <div className="space-y-2">
            {candidates.slice(0, 5).map((candidate) => (
              <button
                type="button"
                key={`${candidate.format}-${candidate.reason}`}
                className="focus-ring w-full rounded border border-white/10 bg-surface-800/50 p-2 text-left text-xs hover:border-cyan-400/50"
                onClick={() => navigate(ROUTE_FOR_FORMAT[candidate.format] ?? '/tool/hex')}
              >
                <div className="flex justify-between">
                  <span className="font-semibold text-slate-100">{candidate.format}</span>
                  <span className="text-slate-400">{Math.round(candidate.confidence * 100)}%</span>
                </div>
                <p className="mt-1 text-slate-400">{candidate.reason}</p>
              </button>
            ))}
          </div>
        </section>

        <section className="glass rounded-md p-3 text-xs">
          <h2 className="mb-2 text-xs uppercase tracking-[0.12em] text-slate-400">Analysis</h2>
          <div className="space-y-2 text-slate-300">
            <p>Entropy estimate: {entropy.toFixed(3)} bits/byte</p>
            <p>Base64 padding: {base64PaddingStatus(input)}</p>
            <p>Base64 variant hint: {base64UrlHint(input)}</p>
            <p>Hex explainer: {explainHexDump(input)}</p>
            {magic && (
              <p>
                Magic bytes: <strong>{magic.name}</strong> ({magic.extension}) - {magic.description}
              </p>
            )}
            {input.includes('.') && <p className="text-amber-300">JWT decode is not signature verification.</p>}
          </div>
        </section>
      </div>
    </section>
  );
}
