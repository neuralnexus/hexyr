import { useMemo, useState } from 'react';
import { convertTimestamp, getPopularTimezones } from '../../../shared/parsing';

export function TimezoneLabPage() {
  const [input, setInput] = useState(new Date().toISOString());
  const [sourceZone, setSourceZone] = useState('UTC');
  const [zonesText, setZonesText] = useState(getPopularTimezones().join(', '));

  const output = useMemo(() => {
    try {
      const zones = zonesText.split(',').map((x) => x.trim()).filter(Boolean);
      return { result: convertTimestamp(input, zones, sourceZone) };
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Failed to convert timestamp' };
    }
  }, [input, sourceZone, zonesText]);

  return (
    <section className="animate-rise space-y-3">
      <h1 className="text-lg font-semibold text-slate-100">Timezone / ISO8601 Lab</h1>
      <input className="focus-ring w-full rounded border border-white/10 bg-surface-900/60 px-3 py-2 font-mono text-sm" value={input} onChange={(e) => setInput(e.target.value)} placeholder="ISO string, unix seconds/ms, or wall time" />
      <div className="grid gap-3 lg:grid-cols-2">
        <input className="focus-ring w-full rounded border border-white/10 bg-surface-900/60 px-3 py-2 font-mono text-sm" value={sourceZone} onChange={(e) => setSourceZone(e.target.value)} placeholder="Source timezone for wall time (e.g. America/New_York)" />
        <input className="focus-ring w-full rounded border border-white/10 bg-surface-900/60 px-3 py-2 font-mono text-sm" value={zonesText} onChange={(e) => setZonesText(e.target.value)} placeholder="Comma-separated output zones" />
      </div>
      {'error' in output ? (
        <div className="rounded border border-red-400/40 bg-red-500/10 p-2 text-sm text-red-300">{output.error}</div>
      ) : (
        <div className="space-y-3">
          <div className="glass rounded-md p-3 text-xs text-slate-300">
            <p>ISO: {output.result.sourceIso}</p>
            <p>Unix seconds: {output.result.unixSeconds}</p>
            <p>RFC 2822: {output.result.rfc2822}</p>
          </div>
          <div className="grid gap-2 lg:grid-cols-2">
            {output.result.zones.map((zone) => (
              <div key={zone.zone} className="glass rounded-md p-3 text-xs text-slate-200">
                <div className="font-semibold">{zone.zone}</div>
                <div>{zone.weekday} {zone.date} {zone.time}</div>
                <div className="text-slate-400">{zone.offset}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
