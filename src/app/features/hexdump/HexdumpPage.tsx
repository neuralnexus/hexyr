import { useMemo, useState } from 'react';
import { formatHexdump } from '../../../shared/analysis/hexdump';
import { textToBytes, hexToBytes } from '../../../shared/encoding';
import { useWorkspace } from '../../hooks/useWorkspace';

export function HexdumpPage() {
  const { input, setInput } = useWorkspace();
  const [bytesPerLine, setBytesPerLine] = useState(16);
  const [uppercase, setUppercase] = useState(false);
  const [offsetBase, setOffsetBase] = useState<10 | 16>(16);

  const output = useMemo(() => {
    let bytes: Uint8Array;
    try {
      bytes = /^[0-9a-fA-F\s]+$/.test(input.trim()) ? hexToBytes(input) : textToBytes(input);
    } catch {
      bytes = textToBytes(input);
    }

    return formatHexdump(bytes, {
      bytesPerLine,
      uppercase,
      offsetBase,
    });
  }, [bytesPerLine, input, offsetBase, uppercase]);

  return (
    <section className="animate-rise space-y-3">
      <header>
        <h1 className="text-lg font-semibold text-slate-100">Hex Viewer and Hexdump</h1>
        <p className="text-sm text-slate-400">Offsets, grouped bytes, ASCII preview, and formatting toggles.</p>
      </header>

      <textarea
        className="focus-ring h-32 w-full resize-none rounded-md border border-white/10 bg-surface-900/60 p-3 font-mono text-sm"
        value={input}
        onChange={(event) => setInput(event.target.value)}
        placeholder="Paste hex or text"
      />

      <div className="flex flex-wrap gap-2 text-xs">
        <label className="glass rounded px-2 py-1">
          Bytes/line
          <select
            className="ml-2 rounded border border-white/10 bg-surface-800 px-2 py-1"
            value={bytesPerLine}
            onChange={(event) => setBytesPerLine(Number(event.target.value))}
          >
            {[8, 16, 24, 32].map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        </label>
        <label className="glass rounded px-2 py-1">
          Offset base
          <select
            className="ml-2 rounded border border-white/10 bg-surface-800 px-2 py-1"
            value={offsetBase}
            onChange={(event) => setOffsetBase(Number(event.target.value) as 10 | 16)}
          >
            <option value={16}>Hex</option>
            <option value={10}>Decimal</option>
          </select>
        </label>
        <label className="glass flex items-center gap-2 rounded px-2 py-1">
          <input type="checkbox" checked={uppercase} onChange={(event) => setUppercase(event.target.checked)} />
          Uppercase
        </label>
      </div>

      <pre className="glass max-h-[48vh] overflow-auto rounded-md p-3 font-mono text-xs text-cyan-100">
        {output || 'No content'}
      </pre>
    </section>
  );
}
