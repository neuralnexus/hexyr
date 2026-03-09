import { Github, MoonStar, Search, SunMedium } from 'lucide-react';
import { Brand } from './Brand';

interface TopBarProps {
  dark: boolean;
  onToggleTheme: () => void;
  onOpenPalette: () => void;
}

export function TopBar({ dark, onToggleTheme, onOpenPalette }: TopBarProps) {
  return (
    <header className="glass flex items-center justify-between px-4">
      <Brand />
      <button
        type="button"
        className="focus-ring hidden w-[38%] max-w-xl items-center gap-2 rounded-md border border-white/10 bg-surface-800 px-3 py-2 text-xs text-slate-300 md:flex"
        onClick={onOpenPalette}
      >
        <Search size={14} />
        <span>Command palette</span>
        <span className="ml-auto rounded bg-black/30 px-1.5 py-0.5 font-mono text-[10px]">Ctrl+K</span>
      </button>
      <div className="flex items-center gap-2">
        <a
          className="focus-ring rounded-md border border-white/10 bg-surface-800 p-2"
          href="https://docs.hexyr.com"
          target="_blank"
          rel="noreferrer"
        >
          Docs
        </a>
        <a
          className="focus-ring rounded-md border border-white/10 bg-surface-800 p-2"
          href="https://github.com/neuralnexus/hexyr"
          target="_blank"
          rel="noreferrer"
          aria-label="Open GitHub repository"
        >
          <Github size={15} />
        </a>
        <button
          className="focus-ring rounded-md border border-white/10 bg-surface-800 p-2"
          type="button"
          onClick={onToggleTheme}
          aria-label="Toggle color mode"
        >
          {dark ? <SunMedium size={15} /> : <MoonStar size={15} />}
        </button>
      </div>
    </header>
  );
}
