import { useEffect, useState } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { CommandPalette } from './components/CommandPalette';
import { MobileToolsDrawer } from './components/MobileToolsDrawer';
import { TopBar } from './components/TopBar';
import { WorkspaceProvider } from './hooks/useWorkspace';
import { AppRoutes } from './routes/AppRoutes';

const THEME_KEY = 'hexyr:theme';

export default function App() {
  const [dark, setDark] = useState(() => localStorage.getItem(THEME_KEY) !== 'light');
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [mobileToolsOpen, setMobileToolsOpen] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle('light', !dark);
    localStorage.setItem(THEME_KEY, dark ? 'dark' : 'light');
  }, [dark]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setPaletteOpen(true);
      }
      if (event.key === 'Escape') {
        setPaletteOpen(false);
      }
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  return (
    <BrowserRouter>
      <WorkspaceProvider>
        <div className="app-shell">
          <TopBar
            dark={dark}
            onToggleTheme={() => setDark((value) => !value)}
            onOpenPalette={() => setPaletteOpen(true)}
            onOpenTools={() => setMobileToolsOpen(true)}
          />
          <AppRoutes />
          <footer className="glass grid grid-cols-1 gap-1 px-3 py-2 text-[11px] text-slate-400 md:grid-cols-3 md:items-center md:px-4">
            <span className="text-center md:hidden">
              <span>Data stays local</span>
              <span className="px-1 text-slate-500">|</span>
              <a
                href="https://mattivan.com"
                target="_blank"
                rel="noreferrer"
                className="focus-ring rounded px-1 text-cyan-300 hover:text-cyan-200"
              >
                Made by Matt Ivan
              </a>
            </span>
            <span className="hidden md:block">Ctrl+K Command Palette</span>
            <span className="hidden text-left md:block md:text-center">
              <a
                href="https://mattivan.com"
                target="_blank"
                rel="noreferrer"
                className="focus-ring rounded px-1 text-cyan-300 hover:text-cyan-200"
              >
                Made by Matt Ivan
              </a>
            </span>
            <span className="hidden items-center gap-2 md:flex md:justify-end">
              <span>Data stays local.</span>
              <span className="text-slate-500">•</span>
              <a
                href="https://donate.stripe.com/eVq5kD1mTgvq7kd0MBeZ200"
                target="_blank"
                rel="noreferrer"
                className="focus-ring rounded px-1 text-cyan-300 hover:text-cyan-200"
              >
                Find Hexyr useful? Support it.
              </a>
            </span>
          </footer>
          <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
          <MobileToolsDrawer open={mobileToolsOpen} onClose={() => setMobileToolsOpen(false)} />
        </div>
      </WorkspaceProvider>
    </BrowserRouter>
  );
}
