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

function parseOffsetHours(offset: string): number {
  const m = offset.match(/GMT([+-])(\d{2}):(\d{2})/);
  if (!m) return 0;
  const sign = m[1] === '-' ? -1 : 1;
  return sign * (Number.parseInt(m[2], 10) + Number.parseInt(m[3], 10) / 60);
}

function SunCoverageMap({ epochMs, zones }: { epochMs: number; zones: Array<{ zone: string; offset: string }> }) {
  const utc = new Date(epochMs);
  const utcHours = utc.getUTCHours() + utc.getUTCMinutes() / 60 + utc.getUTCSeconds() / 3600;
  const sunLongitude = ((utcHours - 12) / 24) * 360;
  const startLon = sunLongitude - 90;
  const endLon = sunLongitude + 90;

  const toX = (lon: number) => ((lon + 180) / 360) * 100;
  const startX = toX(startLon);
  const endX = toX(endLon);

  return (
    <div className="glass rounded-md p-3">
      <div className="mb-2 text-xs uppercase tracking-[0.1em] text-slate-400">Sunlight Coverage</div>
      <div className="relative h-16 overflow-hidden rounded border border-white/10 bg-surface-900/70">
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950" />
        {startX >= 0 && endX <= 100 ? (
          <div className="absolute bottom-0 top-0 bg-gradient-to-r from-amber-300/15 via-yellow-200/35 to-amber-300/15" style={{ left: `${startX}%`, width: `${Math.max(0, endX - startX)}%` }} />
        ) : (
          <>
            <div className="absolute bottom-0 top-0 bg-gradient-to-r from-amber-300/15 via-yellow-200/35 to-amber-300/15" style={{ left: '0%', width: `${Math.max(0, endX)}%` }} />
            <div className="absolute bottom-0 top-0 bg-gradient-to-r from-amber-300/15 via-yellow-200/35 to-amber-300/15" style={{ left: `${Math.max(0, startX)}%`, width: `${Math.max(0, 100 - Math.max(0, startX))}%` }} />
          </>
        )}

        <div className="absolute inset-0">
          {zones.map((zone) => {
            const lon = parseOffsetHours(zone.offset) * 15;
            const x = toX(lon);
            return (
              <div key={zone.zone} className="absolute bottom-0 top-0" style={{ left: `${x}%` }}>
                <div className="h-full w-px bg-cyan-300/35" />
              </div>
            );
          })}
        </div>
      </div>
      <p className="mt-1 text-[11px] text-slate-500">Approximate day/night by longitude with timezone markers.</p>
    </div>
  );
}

function DigitalClock({ zone, date, time }: { zone: string; date: string; time: string }) {
  return (
    <div className="rounded border border-cyan-400/20 bg-surface-900/70 px-2 py-1 text-right font-mono shadow-[inset_0_0_20px_rgba(8,145,178,0.15)]">
      <div className="text-[10px] uppercase tracking-[0.1em] text-cyan-300/90">{zone}</div>
      <div className="text-sm leading-none text-cyan-200">{time}</div>
      <div className="text-[10px] text-slate-400">{date}</div>
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
      <input className="focus-ring w-full rounded border border-white/10 bg-surface-900/60 px-3 py-2 font-mono text-sm" value={input} onChange={(e) => setInput(e.target.value)} placeholder="ISO/unix/wall time, or natural text like 'noon India time' or '8-11am Pacific'" />
      <div className="grid gap-3 lg:grid-cols-2">
        <input className="focus-ring w-full rounded border border-white/10 bg-surface-900/60 px-3 py-2 font-mono text-sm" value={sourceZone} onChange={(e) => setSourceZone(e.target.value)} placeholder="Source timezone for wall time (e.g. America/New_York)" />
        <input className="focus-ring w-full rounded border border-white/10 bg-surface-900/60 px-3 py-2 font-mono text-sm" value={zonesText} onChange={(e) => setZonesText(e.target.value)} placeholder="Comma-separated output zones" />
      </div>
      {'error' in output ? (
        <div className="rounded border border-red-400/40 bg-red-500/10 p-2 text-sm text-red-300">{output.error}</div>
      ) : (
        <div className="space-y-3">
          <SunCoverageMap epochMs={output.result.unixMilliseconds} zones={output.result.zones.map((z) => ({ zone: z.zone, offset: z.offset }))} />
          <div className="glass rounded-md p-3 text-xs text-slate-300">
            <p>ISO: {output.result.sourceIso}</p>
            <p>Unix seconds: {output.result.unixSeconds}</p>
            <p>RFC 2822: {output.result.rfc2822}</p>
            {output.result.interpretedInput && <p>Interpreted: {output.result.interpretedInput}</p>}
            {output.result.range && <p>Range: {output.result.range.startIso} to {output.result.range.endIso} ({output.result.range.durationMinutes}m)</p>}
          </div>
          <div className="grid gap-2 lg:grid-cols-2">
            {output.result.zones.map((zone) => (
              <div key={zone.zone} className="glass flex items-center justify-between rounded-md p-3 text-xs text-slate-200">
                <div>
                  <div className="font-semibold">{zone.zone}</div>
                  <div>{zone.weekday} {zone.date} {zone.time}</div>
                  <div className="text-slate-400">{zone.offset}</div>
                  {zone.rangeTime && <div className="text-slate-400">Window: {zone.rangeTime}</div>}
                </div>
                <div className="flex items-center gap-2">
                  <DigitalClock zone={zone.zone} date={`${zone.weekday} ${zone.date}`} time={zone.time} />
                  <ClockFace time={zone.time} tick={tick} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
