import { useEffect, useMemo, useState } from 'react';
import {
  compressText,
  decompressBase64,
  decompressBase64Auto,
  detectCompression,
  getSupportedCompressionFormats,
  type CompressionFormat,
} from '../../../shared/analysis';
import { base64ToBytes } from '../../../shared/encoding';

export function CompressionPage() {
  const [mode, setMode] = useState<'compress' | 'decompress'>('compress');
  const [format, setFormat] = useState<CompressionFormat>('gzip');
  const [input, setInput] = useState('hello hexyr');
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const [detected, setDetected] = useState('unknown');
  const [lastUsed, setLastUsed] = useState('');

  const supported = useMemo(() => getSupportedCompressionFormats(), []);

  useEffect(() => {
    if (mode === 'compress' && format === 'brotli') {
      setFormat('gzip');
    }
  }, [mode, format]);

  const run = async () => {
    try {
      if (mode === 'compress') {
        const selected: CompressionFormat = format === 'brotli' ? 'gzip' : format;
        const next = await compressText(input, selected);
        setOutput(next);
        setLastUsed(`Compressed with ${selected}`);
      } else if (format === 'brotli') {
        const auto = await decompressBase64Auto(input);
        setOutput(auto.text);
        setLastUsed(`Auto-decompressed using ${auto.format}`);
      } else {
        const next = await decompressBase64(input, format);
        setOutput(next);
        setLastUsed(`Decompressed with ${format}`);
      }
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Compression operation failed');
      setOutput('');
      setLastUsed('');
    }

    try {
      const bytes = base64ToBytes(input);
      setDetected(detectCompression(bytes));
    } catch {
      setDetected('unknown');
    }
  };

  return (
    <section className="animate-rise space-y-3">
      <h1 className="text-lg font-semibold text-slate-100">Compressed Payload Inspector</h1>
      <div className="flex flex-wrap gap-2 text-sm">
        <select className="focus-ring rounded border border-white/10 bg-surface-800 px-2 py-2" value={mode} onChange={(e) => setMode(e.target.value as 'compress' | 'decompress')}>
          <option value="compress">Compress</option>
          <option value="decompress">Decompress</option>
        </select>
        <select className="focus-ring rounded border border-white/10 bg-surface-800 px-2 py-2" value={format} onChange={(e) => setFormat(e.target.value as CompressionFormat)}>
          <option value="gzip">gzip</option>
          <option value="deflate">deflate</option>
          <option value="brotli" disabled={mode === 'compress'}>auto detect (decompress only)</option>
        </select>
        <button
          type="button"
          className="focus-ring rounded border border-white/10 bg-surface-800 px-3 py-2"
          onClick={() => void run()}
        >
          Run
        </button>
        <button
          type="button"
          className="focus-ring rounded border border-white/10 bg-surface-800 px-3 py-2"
          onClick={() => {
            if (output) {
              setInput(output);
              setOutput('');
              setError('');
            }
          }}
          disabled={!output}
        >
          Use output as input
        </button>
      </div>
      {supported.length === 0 && (
        <div className="rounded border border-amber-400/40 bg-amber-500/10 p-2 text-xs text-amber-300">
          This browser/runtime does not expose CompressionStream/DecompressionStream APIs.
        </div>
      )}
      <textarea className="focus-ring h-36 w-full resize-none rounded border border-white/10 bg-surface-900/60 p-3 font-mono text-sm" value={input} onChange={(e) => setInput(e.target.value)} />
      <p className="text-xs text-slate-400">Detected input format from base64 bytes: {detected}</p>
      {mode === 'compress' && <p className="text-xs text-slate-500">Compression supports gzip/deflate. Auto mode is only for decompression detection.</p>}
      {lastUsed && <p className="text-xs text-cyan-300">{lastUsed}</p>}
      {error && <div className="rounded border border-red-400/40 bg-red-500/10 p-2 text-sm text-red-300">{error}</div>}
      <pre className="glass max-h-52 overflow-auto rounded-md p-3 font-mono text-xs text-cyan-100">{output}</pre>
    </section>
  );
}
