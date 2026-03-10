import { X } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { TOOL_DEFS } from '../utils/tools';

const GROUPS: Array<'Core' | 'Inspect' | 'Crypto' | 'Utilities'> = ['Core', 'Inspect', 'Crypto', 'Utilities'];

interface MobileToolsDrawerProps {
  open: boolean;
  onClose: () => void;
}

export function MobileToolsDrawer({ open, onClose }: MobileToolsDrawerProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 bg-black/65 backdrop-blur-sm lg:hidden" onClick={onClose} role="dialog" aria-modal="true" aria-label="Tools menu">
      <aside
        className="glass h-full w-[84vw] max-w-sm overflow-y-auto border-r border-white/10 p-3"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-100">Tools</h2>
          <button type="button" onClick={onClose} className="focus-ring rounded border border-white/10 bg-surface-800 p-1.5" aria-label="Close tools menu">
            <X size={14} />
          </button>
        </div>

        {GROUPS.map((group) => (
          <div key={group} className="mb-4">
            <h3 className="mb-2 px-1 text-[11px] uppercase tracking-[0.12em] text-slate-400">{group}</h3>
            <div className="space-y-1">
              {TOOL_DEFS.filter((tool) => tool.group === group)
                .sort((a, b) => a.label.localeCompare(b.label))
                .map((tool) => (
                  <NavLink
                    key={tool.key}
                    to={tool.route}
                    onClick={onClose}
                    className={({ isActive }) =>
                      `focus-ring block rounded-md px-3 py-2 text-sm transition ${
                        isActive ? 'bg-cyan-500/15 text-cyan-200 shadow-glow' : 'text-slate-300 hover:bg-white/5 hover:text-white'
                      }`
                    }
                  >
                    {tool.label}
                  </NavLink>
                ))}
            </div>
          </div>
        ))}
      </aside>
    </div>
  );
}
