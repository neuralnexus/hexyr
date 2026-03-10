import { useState } from 'react';
import {
  convertStructured,
  formatByKind,
  minifyByKind,
  validateByKind,
  type FormatterKind,
  type StructuredFormat,
} from '../../../shared/parsing';
import { useWorkspace } from '../../hooks/useWorkspace';

export function JsonYamlFormatterPage() {
  const { input, setInput } = useWorkspace();
  const [kind, setKind] = useState<FormatterKind>('json');
  const [fromFormat, setFromFormat] = useState<StructuredFormat>('json');
  const [toFormat, setToFormat] = useState<StructuredFormat>('yaml');
  const [status, setStatus] = useState('');

  const run = (action: 'format' | 'expand' | 'minify' | 'validate') => {
    try {
      if (action === 'validate') {
        const result = validateByKind(input, kind);
        setStatus(result.message);
        return;
      }
      const next = action === 'minify' ? minifyByKind(input, kind) : formatByKind(input, kind);
      setInput(next);
      setStatus(
        action === 'minify'
          ? `${kind.toUpperCase()} minified`
          : `${kind.toUpperCase()} expanded (pretty-printed)`,
      );
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'Formatting failed');
    }
  };

  const runConvert = () => {
    try {
      const next = convertStructured(input, fromFormat, toFormat);
      setInput(next);
      setStatus(`Converted ${fromFormat.toUpperCase()} -> ${toFormat.toUpperCase()}`);
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'Conversion failed');
    }
  };

  return (
    <section className="animate-rise space-y-3">
      <h1 className="text-lg font-semibold text-slate-100">Formatter Lab</h1>
      <div className="flex flex-wrap gap-2 text-sm">
        <select
          className="focus-ring rounded border border-white/10 bg-surface-800 px-2 py-2"
          value={kind}
          onChange={(event) => setKind(event.target.value as FormatterKind)}
        >
          <option value="json">JSON</option>
          <option value="yaml">YAML</option>
          <option value="toml">TOML</option>
          <option value="xml">XML</option>
          <option value="ini">INI / .env</option>
          <option value="sql">SQL</option>
          <option value="http">HTTP Message</option>
        </select>
        <button
          type="button"
          className="focus-ring rounded border border-white/10 bg-surface-800 px-3 py-2"
          onClick={() => run('expand')}
        >
          Expand
        </button>
        <button
          type="button"
          className="focus-ring rounded border border-white/10 bg-surface-800 px-3 py-2"
          onClick={() => run('minify')}
        >
          Minify
        </button>
        <button
          type="button"
          className="focus-ring rounded border border-white/10 bg-surface-800 px-3 py-2"
          onClick={() => run('validate')}
        >
          Validate
        </button>
      </div>
      <div className="glass flex flex-wrap items-center gap-2 rounded-md p-2 text-xs">
        <span className="text-slate-400">Converter</span>
        <select className="focus-ring rounded border border-white/10 bg-surface-800 px-2 py-1" value={fromFormat} onChange={(event) => setFromFormat(event.target.value as StructuredFormat)}>
          <option value="json">JSON</option>
          <option value="yaml">YAML</option>
          <option value="toml">TOML</option>
        </select>
        <span className="text-slate-500">to</span>
        <select className="focus-ring rounded border border-white/10 bg-surface-800 px-2 py-1" value={toFormat} onChange={(event) => setToFormat(event.target.value as StructuredFormat)}>
          <option value="json">JSON</option>
          <option value="yaml">YAML</option>
          <option value="toml">TOML</option>
        </select>
        <button type="button" className="focus-ring rounded border border-white/10 bg-surface-800 px-3 py-1" onClick={runConvert}>Convert</button>
      </div>
      <textarea
        className="focus-ring h-64 w-full resize-none rounded border border-white/10 bg-surface-900/60 p-3 font-mono text-sm"
        value={input}
        onChange={(event) => setInput(event.target.value)}
        placeholder="Paste JSON/YAML/TOML/XML/INI/SQL/HTTP message"
      />
      {status && <p className="text-xs text-cyan-300">{status}</p>}
    </section>
  );
}
