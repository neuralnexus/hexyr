import { useEffect, useState } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { TopBar } from './components/TopBar';
import { WorkspaceProvider } from './hooks/useWorkspace';
import { AppRoutes } from './routes/AppRoutes';

const THEME_KEY = 'hexyr:theme';

export default function App() {
  const [dark, setDark] = useState(() => localStorage.getItem(THEME_KEY) !== 'light');

  useEffect(() => {
    document.documentElement.classList.toggle('light', !dark);
    localStorage.setItem(THEME_KEY, dark ? 'dark' : 'light');
  }, [dark]);

  return (
    <BrowserRouter>
      <WorkspaceProvider>
        <div className="app-shell">
          <TopBar dark={dark} onToggleTheme={() => setDark((value) => !value)} />
          <AppRoutes />
          <footer className="glass flex items-center justify-between px-4 text-[11px] text-slate-400">
            <span>Ctrl+K Command Palette (skeleton)</span>
            <span>Local-first: payloads stay in your browser.</span>
          </footer>
        </div>
      </WorkspaceProvider>
    </BrowserRouter>
  );
}
