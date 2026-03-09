import { computeStats, extractHexColors } from '../../shared/analysis';
import { detectFormats } from '../../shared/detection';
import { suggestDecodingStrategies } from '../../shared/explainers';
import { useWorkspace } from '../hooks/useWorkspace';

export function MetaPanel() {
  const { input } = useWorkspace();
  const stats = computeStats(input);
  const candidates = detectFormats(input).slice(0, 3);
  const colors = extractHexColors(input);

  return (
    <aside className="glass hidden h-full w-80 space-y-4 overflow-auto p-3 xl:block">
      <section className="rounded-md border border-white/10 bg-surface-800/70 p-3">
        <h3 className="mb-2 text-xs uppercase tracking-[0.12em] text-slate-400">Detection</h3>
        <div className="space-y-2 text-xs">
          {candidates.map((candidate) => (
            <div key={candidate.format} className="rounded border border-white/10 p-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-200">{candidate.format}</span>
                <span className="text-slate-400">{Math.round(candidate.confidence * 100)}%</span>
              </div>
              <p className="mt-1 text-slate-400">{candidate.reason}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-md border border-white/10 bg-surface-800/70 p-3 text-xs">
        <h3 className="mb-2 text-xs uppercase tracking-[0.12em] text-slate-400">Stats</h3>
        <div className="grid grid-cols-2 gap-2">
          <Stat label="Bytes" value={stats.byteCount} />
          <Stat label="Chars" value={stats.charCount} />
          <Stat label="Bits" value={stats.bitLength} />
          <Stat label="Lines" value={stats.lineCount} />
        </div>
      </section>

      <section className="rounded-md border border-white/10 bg-surface-800/70 p-3 text-xs text-slate-300">
        <h3 className="mb-2 text-xs uppercase tracking-[0.12em] text-slate-400">Heuristic Guidance</h3>
        <p>{suggestDecodingStrategies(input)}</p>
      </section>

      {colors.length > 0 && (
        <section className="rounded-md border border-white/10 bg-surface-800/70 p-3 text-xs">
          <h3 className="mb-2 text-xs uppercase tracking-[0.12em] text-slate-400">Extracted Colors</h3>
          <div className="space-y-2">
            {colors.map((color) => (
              <div key={color} className="flex items-center gap-2">
                <span className="h-4 w-4 rounded border border-white/20" style={{ backgroundColor: color }} />
                <span className="font-mono text-slate-300">{color}</span>
              </div>
            ))}
          </div>
        </section>
      )}
    </aside>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded border border-white/10 px-2 py-1">
      <div className="text-slate-400">{label}</div>
      <div className="font-mono text-slate-200">{value}</div>
    </div>
  );
}
