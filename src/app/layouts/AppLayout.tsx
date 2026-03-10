import { Outlet } from 'react-router-dom';
import { MetaPanel } from '../components/MetaPanel';
import { Sidebar } from '../components/Sidebar';

export function AppLayout() {
  return (
    <main className="grid h-full min-h-0 overflow-hidden grid-cols-1 lg:grid-cols-[16rem_1fr] xl:grid-cols-[16rem_1fr_20rem]">
      <Sidebar />
      <section className="min-h-0 overflow-auto p-3 md:p-4">
        <Outlet />
      </section>
      <MetaPanel />
    </main>
  );
}
