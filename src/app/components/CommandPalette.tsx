import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWorkspace } from '../hooks/useWorkspace';
import { TOOL_DEFS } from '../utils/tools';

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
}

export function CommandPalette({ open, onClose }: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();
  const { setActiveTool } = useWorkspace();

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) {
      return TOOL_DEFS;
    }
    return TOOL_DEFS.filter(
      (tool) =>
        tool.label.toLowerCase().includes(needle) ||
        tool.key.toLowerCase().includes(needle) ||
        tool.group.toLowerCase().includes(needle) ||
        (tool.aliases ?? []).some((alias) => alias.toLowerCase().includes(needle)),
    );
  }, [query]);

  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 p-4 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Command palette"
    >
      <div
        className="mx-auto mt-20 w-full max-w-2xl rounded-xl border border-white/10 bg-surface-900 p-3 shadow-glow"
        onClick={(event) => event.stopPropagation()}
      >
        <input
          autoFocus
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Escape') {
              onClose();
            }
            if (event.key === 'Enter' && filtered[0]) {
              setActiveTool(filtered[0].key);
              navigate(filtered[0].route);
              onClose();
            }
          }}
          className="focus-ring w-full rounded-md border border-white/10 bg-surface-800 px-3 py-2 font-mono text-sm text-slate-100"
          placeholder="Search tools (hex, jwt, hash, inspector)"
        />
        <div className="mt-2 max-h-80 overflow-auto">
          {filtered.map((tool) => (
            <button
              key={tool.key}
              className="focus-ring flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm text-slate-200 hover:bg-white/5"
              type="button"
              onClick={() => {
                setActiveTool(tool.key);
                navigate(tool.route);
                onClose();
              }}
            >
              <span>{tool.label}</span>
              <span className="text-[11px] uppercase tracking-wider text-slate-400">
                {tool.group}
              </span>
            </button>
          ))}
          {filtered.length === 0 && (
            <div className="px-3 py-4 text-sm text-slate-400">No matching tools.</div>
          )}
        </div>
      </div>
    </div>
  );
}
