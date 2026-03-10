import { useEffect, useMemo, useState } from 'react';
import { convertTimestamp, getPopularTimezones } from '../../../shared/parsing';

function parseClockAngles(time: string): { hour: number; minute: number; second: number } {
  const [h, m, s] = time.split(':').map((value) => Number.parseInt(value, 10));
  const hour = ((h % 12) + m / 60 + s / 3600) * 30;
  const minute = (m + s / 60) * 6;
  const second = s * 6;
  return { hour, minute, second };
}

function ClockFace({ time }: { time: string }) {
  const base = parseClockAngles(time);
  const hour = base.hour;
  const minute = base.minute;
  const second = base.second;
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

function isDayLongitude(lon: number, startLon: number, endLon: number): boolean {
  const norm = ((lon + 540) % 360) - 180;
  const s = ((startLon + 540) % 360) - 180;
  const e = ((endLon + 540) % 360) - 180;
  if (s <= e) return norm >= s && norm <= e;
  return norm >= s || norm <= e;
}

function shortZoneLabel(zone: string, offset: string): string {
  if (zone === 'UTC') return 'UTC';
  if (zone === 'America/Los_Angeles') return offset === 'GMT-07:00' ? 'PDT' : 'PST';
  if (zone === 'America/New_York') return offset === 'GMT-04:00' ? 'EDT' : 'EST';
  if (zone === 'America/Chicago') return offset === 'GMT-05:00' ? 'CDT' : 'CST';
  if (zone === 'Europe/London') return offset === 'GMT+01:00' ? 'BST' : 'GMT';
  if (zone === 'Europe/Berlin') return offset === 'GMT+02:00' ? 'CEST' : 'CET';
  if (zone === 'Europe/Kyiv') return offset === 'GMT+03:00' ? 'EEST' : 'EET';
  if (zone === 'Asia/Dubai') return 'GST';
  if (zone === 'Asia/Kolkata') return 'IST';
  if (zone === 'Asia/Hong_Kong') return 'HKT';
  if (zone === 'Asia/Seoul') return 'KST';
  if (zone === 'Asia/Tokyo') return 'JST';
  if (zone === 'Australia/Sydney') return offset === 'GMT+11:00' ? 'AEDT' : 'AEST';
  if (zone === 'Pacific/Auckland') return offset === 'GMT+13:00' ? 'NZDT' : 'NZST';

  const tail = zone.split('/').at(-1) ?? zone;
  const normalized = tail.replace(/[^A-Za-z]/g, '').toUpperCase();
  return (normalized.slice(0, 4) || 'TZ').padEnd(3, 'X');
}

function SunCoverageMap({ epochMs, zones, isRangePlayback }: { epochMs: number; zones: Array<{ zone: string; offset: string }>; isRangePlayback: boolean }) {
  const utc = new Date(epochMs);
  const utcHours = utc.getUTCHours() + utc.getUTCMinutes() / 60 + utc.getUTCSeconds() / 3600;
  const sunLongitude = ((12 - utcHours) / 24) * 360;
  const startLon = sunLongitude - 90;
  const endLon = sunLongitude + 90;

  const toX = (lon: number) => ((lon + 180) / 360) * 100;
  const startX = toX(startLon);
  const endX = toX(endLon);

  const markerPalette = ['#38bdf8', '#22d3ee', '#34d399', '#a3e635', '#facc15', '#fb7185', '#c084fc', '#f97316', '#60a5fa', '#f472b6'];

  const markers = zones.map((zone) => {
    const lon = parseOffsetHours(zone.offset) * 15;
    return {
      zone: zone.zone,
      x: toX(lon),
      lon,
      short: shortZoneLabel(zone.zone, zone.offset),
    };
  }).sort((a, b) => a.x - b.x)
    .map((marker, idx) => ({
      ...marker,
      color: markerPalette[idx % markerPalette.length],
    }));

  const labelMarkers = markers
    .filter((marker, idx, arr) => idx === 0 || marker.x - arr[idx - 1].x >= 4)
    .map((marker, idx) => ({
      ...marker,
      side: idx % 2 === 0 ? -1 : 1,
      row: idx % 3,
    }));

  const leftIsDay = isDayLongitude(-135, startLon, endLon);
  const rightIsDay = isDayLongitude(135, startLon, endLon);
  const leftLabel = leftIsDay ? 'Daylight' : 'Night';
  const rightLabel = rightIsDay ? 'Daylight' : 'Night';

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
          {markers.map((marker) => {
            return (
              <div key={marker.zone} className="absolute bottom-0 top-0" style={{ left: `${marker.x}%` }}>
                <div className="h-full w-[2px]" style={{ backgroundColor: marker.color, opacity: 0.65 }} />
              </div>
            );
          })}
        </div>
        <div className="pointer-events-none absolute inset-0">
          {labelMarkers.map((marker) => (
            <div
              key={`${marker.zone}-label`}
              className="absolute text-[9px] font-mono"
              style={{
                left: `${marker.x}%`,
                top: `${1.05 + marker.row * 0.55}rem`,
                color: marker.color,
                transform: marker.side === -1 ? 'translateX(calc(-100% - 4px))' : 'translateX(4px)',
              }}
            >
              <span className="rounded bg-surface-950/70 px-1 py-[1px]">{marker.short}</span>
            </div>
          ))}
        </div>
        <div className={`absolute left-2 top-1 text-[10px] uppercase tracking-[0.08em] ${leftIsDay ? 'text-amber-100/70' : 'text-slate-300/70'}`}>{leftLabel}</div>
        <div className={`absolute right-2 top-1 text-[10px] uppercase tracking-[0.08em] ${rightIsDay ? 'text-amber-100/70' : 'text-slate-300/70'}`}>{rightLabel}</div>
        <div className="absolute left-2 bottom-1 text-[10px] text-slate-400">-180°</div>
        <div className="absolute right-2 bottom-1 text-[10px] text-slate-400">+180°</div>
      </div>
      <p className="mt-1 text-[11px] text-slate-500">Approximate day/night by longitude. Each line color matches its timezone chip.</p>
      <p className="text-[10px] text-slate-500">
        {isRangePlayback ? 'Map animates through the selected range window.' : 'Map updates every second.'}
      </p>
      <div className="mt-1 flex flex-wrap gap-1.5">
        {markers.map((marker) => (
          <span key={marker.zone} className="inline-flex items-center gap-1 rounded border border-white/10 bg-surface-900/50 px-1.5 py-0.5 text-[10px] text-slate-300">
            <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: marker.color }} />
            {marker.zone}
          </span>
        ))}
      </div>
    </div>
  );
}

function DigitalClock({ zone, date, time }: { zone: string; date: string; time: string }) {
  return (
    <div className="flex h-[5.25rem] w-[15.5rem] flex-col items-center justify-center rounded border border-cyan-400/20 bg-surface-900/70 px-3 py-1 font-mono text-center shadow-[inset_0_0_20px_rgba(8,145,178,0.15)] sm:w-[16.75rem]">
      <div className="w-full truncate text-[10px] uppercase tracking-[0.1em] text-cyan-300/90">{zone}</div>
      <div className="text-[2rem] leading-[1] text-cyan-200">{time}</div>
      <div className="text-[10px] text-slate-400">{date}</div>
    </div>
  );
}

function formatZoneAtEpoch(epochMs: number, zone: string): { date: string; time: string; offset: string; weekday: string } {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: zone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    weekday: 'short',
    hour12: false,
    timeZoneName: 'longOffset',
  });
  const parts = formatter.formatToParts(new Date(epochMs));
  const map: Record<string, string> = {};
  for (const p of parts) map[p.type] = p.value;
  return {
    date: `${map.year}-${map.month}-${map.day}`,
    time: `${map.hour}:${map.minute}:${map.second}`,
    offset: map.timeZoneName ?? 'GMT+0',
    weekday: map.weekday ?? '',
  };
}

function formatRfc2822(epochMs: number): string {
  return new Date(epochMs).toUTCString();
}

function computePlaybackEpoch(baseEpochMs: number, tick: number, range?: { startIso: string; endIso: string }): number {
  if (!range) return baseEpochMs + tick * 1000;
  const startMs = Date.parse(range.startIso);
  const endMs = Date.parse(range.endIso);
  const spanMs = Math.max(1, endMs - startMs);
  return startMs + ((tick * 1000) % spanMs);
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

  const playback = useMemo(() => {
    if ('error' in output) return null;
    const epochMs = computePlaybackEpoch(output.result.unixMilliseconds, tick, output.result.range);
    const summaryDate = new Date(epochMs);
    const zones = output.result.zones.map((zone) => {
      const live = formatZoneAtEpoch(epochMs, zone.zone);
      return {
        ...zone,
        ...live,
      };
    });
    return {
      epochMs,
      iso: summaryDate.toISOString(),
      unixSeconds: Math.floor(epochMs / 1000),
      rfc2822: formatRfc2822(epochMs),
      zones,
    };
  }, [output, tick]);

  return (
    <section className="animate-rise space-y-3">
      <h1 className="text-lg font-semibold text-slate-100">TimeZone Lab</h1>
      <input className="focus-ring w-full rounded border border-white/10 bg-surface-900/60 px-3 py-2 font-mono text-sm" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Time input (supports ranges): 11am-3pm PST, noon India time, 2026-03-10T18:00:00Z" />
      <p className="text-xs text-slate-500">Tip: range input like <code>8-11am Pacific</code> shows a converted window for each timezone.</p>
      <div className="grid gap-3 lg:grid-cols-2">
        <input className="focus-ring w-full rounded border border-white/10 bg-surface-900/60 px-3 py-2 font-mono text-sm" value={sourceZone} onChange={(e) => setSourceZone(e.target.value)} placeholder="Source timezone for wall time (e.g. America/New_York)" />
        <input className="focus-ring w-full rounded border border-white/10 bg-surface-900/60 px-3 py-2 font-mono text-sm" value={zonesText} onChange={(e) => setZonesText(e.target.value)} placeholder="Comma-separated output zones" />
      </div>
      {'error' in output ? (
        <div className="rounded border border-red-400/40 bg-red-500/10 p-2 text-sm text-red-300">{output.error}</div>
      ) : (
        <div className="space-y-3">
          <SunCoverageMap
            epochMs={playback?.epochMs ?? output.result.unixMilliseconds}
            zones={(playback?.zones ?? output.result.zones).map((z) => ({ zone: z.zone, offset: z.offset }))}
            isRangePlayback={Boolean(output.result.range)}
          />
          <div className="glass rounded-md p-3 text-xs text-slate-300">
            <p>ISO: {playback?.iso ?? output.result.sourceIso}</p>
            <p>Unix seconds: {playback?.unixSeconds ?? output.result.unixSeconds}</p>
            <p>RFC 2822: {playback?.rfc2822 ?? output.result.rfc2822}</p>
            {output.result.interpretedInput && <p>Interpreted: {output.result.interpretedInput}</p>}
            {output.result.range && <p>Range: {output.result.range.startIso} to {output.result.range.endIso} ({output.result.range.durationMinutes}m)</p>}
          </div>
          <div className="grid gap-2 lg:grid-cols-2">
            {(playback?.zones ?? output.result.zones).map((zone) => (
              <div key={zone.zone} className="glass flex items-center justify-between rounded-md p-3 text-xs text-slate-200">
                <div>
                  <div className="font-semibold">{zone.zone}</div>
                  <div>{zone.weekday} {zone.date} {zone.time}</div>
                  <div className="text-slate-400">{zone.offset}</div>
                  {zone.rangeTime && <div className="text-slate-400">Window: {zone.rangeTime}</div>}
                </div>
                <div className="flex items-center gap-2">
                  <DigitalClock zone={zone.zone} date={`${zone.weekday} ${zone.date}`} time={zone.time} />
                  <ClockFace time={zone.time} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
