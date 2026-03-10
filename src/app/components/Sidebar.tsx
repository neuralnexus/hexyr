import { NavLink } from 'react-router-dom';
import { TOOL_DEFS } from '../utils/tools';

const GROUPS: Array<'Core' | 'Inspect' | 'Crypto' | 'Utilities'> = [
  'Core',
  'Crypto',
  'Inspect',
  'Utilities',
];

export function Sidebar() {
  return (
    <aside className="glass hidden h-full min-h-0 w-64 overflow-y-auto overflow-x-hidden overscroll-contain p-3 lg:block">
      {GROUPS.map((group) => (
        <div key={group} className="mb-4">
          <h2 className="mb-2 px-2 text-[11px] uppercase tracking-[0.14em] text-slate-400">{group}</h2>
          <div className="space-y-1">
            {TOOL_DEFS
              .filter((tool) => tool.group === group)
              .sort((a, b) => a.label.localeCompare(b.label))
              .map((tool) => (
              <NavLink
                key={tool.key}
                to={tool.route}
                className={({ isActive }) =>
                  `focus-ring block rounded-md px-3 py-2 text-sm transition ${
                    isActive
                      ? 'bg-cyan-500/15 text-cyan-200 shadow-glow'
                      : 'text-slate-300 hover:bg-white/5 hover:text-white'
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
  );
}
