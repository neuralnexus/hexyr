import { useEffect, useMemo, useState } from 'react';
import { convertTimestamp, getPopularTimezones } from '../../../shared/parsing';

function parseClockAngles(time: string): { hour: number; minute: number; second: number } {
  const [h, m, s] = time.split(':').map((value) => Number.parseInt(value, 10));
  const hour = ((h % 12) + m / 60 + s / 3600) * 30;
  const minute = (m + s / 60) * 6;
  const second = s * 6;
  return { hour, minute, second };
}

function ClockFace({ time, tick }: { time: string; tick: number }) {
  const base = parseClockAngles(time);
  const hour = (base.hour + tick / 120) % 360;
  const minute = (base.minute + tick / 10) % 360;
  const second = (base.second + tick * 6) % 360;
  return (
    <div className="relative h-14 w-14 rounded-full border border-cyan-400/30 bg-surface-900/70 shadow-[0_0_20px_rgba(34,211,238,0.12)]">
      <span className="absolute left-1/2 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-200" />
      <span
        className="absolute left-1/2 top-1/2 block h-4 w-0.5 origin-bottom rounded bg-slate-100"
        style={{ transform: `translate(-50%, -100%) rotate(${hour}deg)` }}
      />
      <span
        className="absolute left-1/2 top-1/2 block h-5 w-0.5 origin-bottom rounded bg-cyan-300"
        style={{ transform: `translate(-50%, -100%) rotate(${minute}deg)` }}
      />
      <span
        className="absolute left-1/2 top-1/2 block h-6 w-px origin-bottom bg-rose-300"
        style={{ transform: `translate(-50%, -100%) rotate(${second}deg)` }}
      />
      <span className="absolute inset-[3px] rounded-full border border-white/10" />
    </div>
  );
}

export function TimezoneLabPage() {
  const [input, setInput] = useState(new Date().toISOString());
  const [sourceZone, setSourceZone] = useState('UTC');
  const [zonesText, setZonesText] = useState(getPopularTimezones().join(', '));
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setTick((value) => value + 1);
    }, 1000);
    return () => window.clearInterval(timer);
  }, []);

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
              <div key={zone.zone} className="glass flex items-center justify-between rounded-md p-3 text-xs text-slate-200">
                <div>
                  <div className="font-semibold">{zone.zone}</div>
                  <div>{zone.weekday} {zone.date} {zone.time}</div>
                  <div className="text-slate-400">{zone.offset}</div>
                </div>
                <ClockFace time={zone.time} tick={tick} />
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
