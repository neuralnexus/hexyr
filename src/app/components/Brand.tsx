import { Link } from 'react-router-dom';

export function Brand() {
  return (
    <Link
      to="/inspect"
      className="brand-chip focus-ring flex items-center gap-3 rounded-lg border border-white/10 px-3 py-1.5"
      aria-label="Go to Universal Inspector"
    >
      <img src="/icons/hexyr-mark.svg" alt="Hexyr logo" className="h-6 w-6" />
      <div className="leading-none">
        <div className="text-[11px] uppercase tracking-[0.2em] text-cyan-300">Hexyr</div>
        <div className="mt-1 text-[10px] font-mono text-slate-400">Developer Toolkit</div>
      </div>
    </Link>
  );
}
