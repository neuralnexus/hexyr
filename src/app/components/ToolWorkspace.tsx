import { ArrowLeftRight, Clipboard, Eraser } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useWorkspace } from '../hooks/useWorkspace';

interface ToolWorkspaceProps {
  title: string;
  description: string;
  transform: (input: string) => string;
  allowSwap?: boolean;
  outputLabel?: string;
}

export function ToolWorkspace({
  title,
  description,
  transform,
  allowSwap = true,
  outputLabel = 'Output',
}: ToolWorkspaceProps) {
  const { input, output, setInput, setOutput, clear } = useWorkspace();
  const [copied, setCopied] = useState(false);

  const nextOutput = useMemo(() => {
    if (!input) {
      return '';
    }
    try {
      return transform(input);
    } catch (error) {
      return error instanceof Error ? `Error: ${error.message}` : 'Error: unable to transform input';
    }
  }, [input, transform]);

  useEffect(() => {
    if (output !== nextOutput) {
      setOutput(nextOutput);
    }
  }, [nextOutput, output, setOutput]);

  const copyOutput = async () => {
    await navigator.clipboard.writeText(nextOutput);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  return (
    <section className="animate-rise space-y-3">
      <header>
        <h1 className="text-lg font-semibold text-slate-100">{title}</h1>
        <p className="text-sm text-slate-400">{description}</p>
      </header>

      <div className="grid gap-3 xl:grid-cols-2">
        <label className="glass rounded-md p-3">
          <div className="mb-2 text-xs uppercase tracking-[0.12em] text-slate-400">Input</div>
          <textarea
            className="focus-ring h-[52vh] w-full resize-none rounded-md border border-white/10 bg-surface-900/60 p-3 font-mono text-sm text-slate-100"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Paste text, hex, base64, JWT, or binary"
          />
        </label>

        <label className="glass rounded-md p-3">
          <div className="mb-2 text-xs uppercase tracking-[0.12em] text-slate-400">{outputLabel}</div>
          <textarea
            readOnly
            className="h-[52vh] w-full resize-none rounded-md border border-white/10 bg-surface-900/40 p-3 font-mono text-sm text-cyan-100"
            value={nextOutput}
            placeholder="Output appears here"
          />
        </label>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className="focus-ring inline-flex items-center gap-2 rounded-md border border-white/10 bg-surface-800 px-3 py-2 text-xs text-slate-100"
          onClick={copyOutput}
        >
          <Clipboard size={14} />
          {copied ? 'Copied' : 'Copy output'}
        </button>
        {allowSwap && (
          <button
            type="button"
            className="focus-ring inline-flex items-center gap-2 rounded-md border border-white/10 bg-surface-800 px-3 py-2 text-xs text-slate-100"
            onClick={() => {
              setInput(nextOutput);
            }}
          >
            <ArrowLeftRight size={14} />
            Swap input/output
          </button>
        )}
        <button
          type="button"
          className="focus-ring inline-flex items-center gap-2 rounded-md border border-white/10 bg-surface-800 px-3 py-2 text-xs text-slate-100"
          onClick={clear}
        >
          <Eraser size={14} />
          Clear
        </button>
      </div>
    </section>
  );
}
