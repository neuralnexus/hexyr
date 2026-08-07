import { CloudOff } from 'lucide-react';
import { useEffect, useState } from 'react';

export function OfflineStatus() {
  const [online, setOnline] = useState(() => navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (online) return null;
  return (
    <div
      className="glass fixed bottom-16 right-4 z-30 flex items-center gap-2 rounded-md px-3 py-2 text-xs text-slate-200 shadow-glow"
      role="status"
    >
      <CloudOff size={14} className="text-amber-300" />
      Offline mode · previously opened tools remain available
    </div>
  );
}
