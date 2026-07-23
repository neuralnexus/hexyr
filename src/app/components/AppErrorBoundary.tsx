import { AlertTriangle, RotateCcw } from 'lucide-react';
import { Component, type ErrorInfo, type ReactNode } from 'react';

interface AppErrorBoundaryState {
  failed: boolean;
}

export class AppErrorBoundary extends Component<{ children: ReactNode }, AppErrorBoundaryState> {
  state: AppErrorBoundaryState = { failed: false };

  static getDerivedStateFromError(): AppErrorBoundaryState {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    if (import.meta.env.DEV) {
      console.error('Hexyr route failed', error, info.componentStack);
    }
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <main className="flex min-h-0 items-center justify-center overflow-auto p-6">
        <section className="glass max-w-lg rounded-lg p-6 text-center">
          <AlertTriangle className="mx-auto text-amber-300" size={28} />
          <h1 className="mt-3 text-lg font-semibold text-slate-100">This tool could not open</h1>
          <p className="mt-2 text-sm text-slate-400">
            Your input was not uploaded or persisted. Reload Hexyr to restore a clean local
            workspace.
          </p>
          <button
            type="button"
            className="focus-ring mt-4 inline-flex items-center gap-2 rounded border border-white/10 bg-surface-800 px-3 py-2 text-sm"
            onClick={() => window.location.reload()}
          >
            <RotateCcw size={14} />
            Reload Hexyr
          </button>
        </section>
      </main>
    );
  }
}
