export interface TimezoneConversion {
  zone: string;
  iso: string;
  date: string;
  time: string;
  offset: string;
  weekday: string;
  rangeTime?: string;
}

export interface TimezoneRange {
  startIso: string;
  endIso: string;
  durationMinutes: number;
}

export interface TimezoneLabResult {
  sourceIso: string;
  unixSeconds: number;
  unixMilliseconds: number;
  rfc2822: string;
  rfc3339: string;
  zones: TimezoneConversion[];
  interpretedInput?: string;
  range?: TimezoneRange;
}

const DEFAULT_ZONES = [
  'UTC',
  'America/Los_Angeles',
  'America/New_York',
  'America/Chicago',
  'Europe/London',
  'Europe/Berlin',
  'Europe/Kyiv',
  'Asia/Dubai',
  'Asia/Kolkata',
  'Asia/Hong_Kong',
  'Asia/Seoul',
  'Asia/Tokyo',
  'Australia/Sydney',
  'Pacific/Auckland',
];

const TIMEZONE_ALIASES: Record<string, string> = {
  UTC: 'UTC',
  GMT: 'UTC',

  IST: 'Asia/Kolkata',
  INDIA: 'Asia/Kolkata',

  PST: 'America/Los_Angeles',
  PT: 'America/Los_Angeles',
  PACIFIC: 'America/Los_Angeles',
  LA: 'America/Los_Angeles',

  EST: 'America/New_York',
  ET: 'America/New_York',
  EASTERN: 'America/New_York',
  NYC: 'America/New_York',

  LON: 'Europe/London',
  UK: 'Europe/London',

  CET: 'Europe/Berlin',

  UKRAINE: 'Europe/Kyiv',
  KYIV: 'Europe/Kyiv',

  'NEW ZEALAND': 'Pacific/Auckland',
  NZ: 'Pacific/Auckland',
  NZST: 'Pacific/Auckland',

  SYDNEY: 'Australia/Sydney',
  AEST: 'Australia/Sydney',

  'HONG KONG': 'Asia/Hong_Kong',
  HONGKONG: 'Asia/Hong_Kong',
  HK: 'Asia/Hong_Kong',
  HKT: 'Asia/Hong_Kong',

  DUBAI: 'Asia/Dubai',
  UAE: 'Asia/Dubai',
  GST: 'Asia/Dubai',

  'US CENTRAL': 'America/Chicago',
  CST: 'America/Chicago',

  SEOUL: 'Asia/Seoul',
  KOREA: 'Asia/Seoul',
  KST: 'Asia/Seoul',
};

function resolveTimezone(zone: string): string {
  const trimmed = zone.trim();
  if (!trimmed) throw new Error('Timezone value cannot be empty');
  const upper = trimmed.toUpperCase();
  return TIMEZONE_ALIASES[upper] ?? trimmed;
}

function assertValidTimezone(zone: string): void {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: zone }).format(new Date());
  } catch {
    throw new Error(`Unsupported timezone: ${zone}`);
  }
}

function parseOffsetMinutes(zoneName: string): number {
  const m = zoneName.match(/GMT([+-])(\d{1,2})(?::?(\d{2}))?/);
  if (!m) return 0;
  const sign = m[1] === '-' ? -1 : 1;
  const hours = Number.parseInt(m[2], 10);
  const mins = Number.parseInt(m[3] ?? '0', 10);
  return sign * (hours * 60 + mins);
}

function getOffsetMinutes(epochMs: number, timeZone: string): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'longOffset',
    hour12: false,
  }).formatToParts(new Date(epochMs));
  const tzName = parts.find((p) => p.type === 'timeZoneName')?.value ?? 'GMT+0';
  return parseOffsetMinutes(tzName);
}

function parseWallTime(input: string): { year: number; month: number; day: number; hour: number; minute: number; second: number } | null {
  const match = input.trim().match(/^(\d{4})-(\d{2})-(\d{2})(?:[T\s](\d{2}):(\d{2})(?::(\d{2}))?)?$/);
  if (!match) return null;
  return {
    year: Number.parseInt(match[1], 10),
    month: Number.parseInt(match[2], 10),
    day: Number.parseInt(match[3], 10),
    hour: Number.parseInt(match[4] ?? '0', 10),
    minute: Number.parseInt(match[5] ?? '0', 10),
    second: Number.parseInt(match[6] ?? '0', 10),
  };
}

function getTodayInZone(zone: string): { year: number; month: number; day: number } {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: zone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  const map: Record<string, string> = {};
  for (const p of parts) map[p.type] = p.value;
  return {
    year: Number.parseInt(map.year, 10),
    month: Number.parseInt(map.month, 10),
    day: Number.parseInt(map.day, 10),
  };
}

function parseClockToken(value: string, meridiem?: string): { hour: number; minute: number } {
  const m = value.trim().match(/^(\d{1,2})(?::(\d{2}))?$/);
  if (!m) throw new Error('Invalid time token');
  let hour = Number.parseInt(m[1], 10);
  const minute = Number.parseInt(m[2] ?? '0', 10);
  if (minute < 0 || minute > 59) throw new Error('Invalid minute value');

  if (meridiem) {
    const lower = meridiem.toLowerCase();
    if (hour < 1 || hour > 12) throw new Error('12-hour time must be between 1 and 12');
    if (lower === 'am') {
      if (hour === 12) hour = 0;
    } else if (lower === 'pm') {
      if (hour !== 12) hour += 12;
    }
  } else if (hour > 23) {
    throw new Error('24-hour time must be between 0 and 23');
  }

  return { hour, minute };
}

function zonedWallToEpochMs(
  wall: { year: number; month: number; day: number; hour: number; minute: number; second: number },
  sourceZone: string,
): number {
  let epoch = Date.UTC(wall.year, wall.month - 1, wall.day, wall.hour, wall.minute, wall.second);
  for (let i = 0; i < 4; i += 1) {
    const offset = getOffsetMinutes(epoch, sourceZone);
    epoch = Date.UTC(wall.year, wall.month - 1, wall.day, wall.hour, wall.minute, wall.second) - offset * 60_000;
  }
  return epoch;
}

function parseNaturalTimeExpression(
  rawInput: string,
  fallbackSourceZone?: string,
): { epochMs: number; interpretedInput?: string; rangeMs?: { startMs: number; endMs: number } } | null {
  const original = rawInput.trim();
  if (!original) return null;

  let cleaned = original.replace(/\btime(?:zone)?\b/gi, '').replace(/\bat\b/gi, ' ').replace(/\s+/g, ' ').trim();
  const parts = cleaned.split(' ');
  let zone = fallbackSourceZone ? resolveTimezone(fallbackSourceZone) : 'UTC';
  let zoneWordsUsed = 0;

  const maxWords = Math.min(3, parts.length);
  for (let words = maxWords; words >= 1; words -= 1) {
    const candidate = parts.slice(parts.length - words).join(' ');
    try {
      const resolved = resolveTimezone(candidate);
      assertValidTimezone(resolved);
      zone = resolved;
      zoneWordsUsed = words;
      break;
    } catch {
      // continue looking
    }
  }

  if (zoneWordsUsed > 0) {
    cleaned = parts.slice(0, parts.length - zoneWordsUsed).join(' ').trim();
  }
  assertValidTimezone(zone);

  const baseDate = getTodayInZone(zone);

  if (/^noon$/i.test(cleaned)) {
    const epochMs = zonedWallToEpochMs({ ...baseDate, hour: 12, minute: 0, second: 0 }, zone);
    return { epochMs, interpretedInput: `12:00 in ${zone}` };
  }

  if (/^midnight$/i.test(cleaned)) {
    const epochMs = zonedWallToEpochMs({ ...baseDate, hour: 0, minute: 0, second: 0 }, zone);
    return { epochMs, interpretedInput: `00:00 in ${zone}` };
  }

  const rangeMatch = cleaned.match(/^(\d{1,2}(?::\d{2})?)\s*(am|pm)?\s*(?:-|to)\s*(\d{1,2}(?::\d{2})?)\s*(am|pm)?$/i);
  if (rangeMatch) {
    const startMeridiem = rangeMatch[2] ?? rangeMatch[4];
    const endMeridiem = rangeMatch[4] ?? rangeMatch[2];
    const startClock = parseClockToken(rangeMatch[1], startMeridiem);
    const endClock = parseClockToken(rangeMatch[3], endMeridiem);
    const startMs = zonedWallToEpochMs({ ...baseDate, hour: startClock.hour, minute: startClock.minute, second: 0 }, zone);
    let endMs = zonedWallToEpochMs({ ...baseDate, hour: endClock.hour, minute: endClock.minute, second: 0 }, zone);
    if (endMs <= startMs) endMs += 24 * 60 * 60 * 1000;
    return {
      epochMs: startMs,
      interpretedInput: `${rangeMatch[1]}-${rangeMatch[3]} ${startMeridiem ?? ''}${endMeridiem && !startMeridiem ? ` ${endMeridiem}` : ''} in ${zone}`
        .replace(/\s+/g, ' ')
        .trim(),
      rangeMs: { startMs, endMs },
    };
  }

  const singleMatch = cleaned.match(/^(\d{1,2}(?::\d{2})?)\s*(am|pm)?$/i);
  if (singleMatch) {
    const clock = parseClockToken(singleMatch[1], singleMatch[2] ?? undefined);
    const epochMs = zonedWallToEpochMs({ ...baseDate, hour: clock.hour, minute: clock.minute, second: 0 }, zone);
    return { epochMs, interpretedInput: `${singleMatch[1]}${singleMatch[2] ? ` ${singleMatch[2]}` : ''} in ${zone}` };
  }

  return null;
}

function zonedWallTimeToEpochMs(input: string, sourceZone: string): number {
  const wall = parseWallTime(input);
  if (!wall) throw new Error('Invalid wall time. Use YYYY-MM-DDTHH:mm:ss');
  return zonedWallToEpochMs(wall, sourceZone);
}

function parseInputToEpoch(input: string, sourceZone?: string): {
  epochMs: number;
  interpretedInput?: string;
  rangeMs?: { startMs: number; endMs: number };
} {
  const trimmed = input.trim();
  if (!trimmed) throw new Error('Timestamp input is required');

  const natural = parseNaturalTimeExpression(trimmed, sourceZone);
  if (natural) return natural;

  if (/^\d+$/.test(trimmed)) {
    const n = Number.parseInt(trimmed, 10);
    return { epochMs: n < 1_000_000_000_000 ? n * 1000 : n };
  }

  if (!/[zZ]|[+-]\d{2}:?\d{2}$/.test(trimmed) && sourceZone) {
    const resolvedSource = resolveTimezone(sourceZone);
    assertValidTimezone(resolvedSource);
    return { epochMs: zonedWallTimeToEpochMs(trimmed, resolvedSource) };
  }

  const parsed = Date.parse(trimmed);
  if (Number.isNaN(parsed)) throw new Error('Invalid timestamp input');
  return { epochMs: parsed };
}

function formatZone(epochMs: number, zone: string): TimezoneConversion {
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
    zone,
    iso: new Date(epochMs).toISOString(),
    date: `${map.year}-${map.month}-${map.day}`,
    time: `${map.hour}:${map.minute}:${map.second}`,
    offset: map.timeZoneName ?? 'GMT+0',
    weekday: map.weekday ?? '',
  };
}

export function convertTimestamp(input: string, zones = DEFAULT_ZONES, sourceZone?: string): TimezoneLabResult {
  const parsed = parseInputToEpoch(input, sourceZone);
  const epochMs = parsed.epochMs;
  const date = new Date(epochMs);
  const resolvedZones = zones.map((zone) => {
    const resolved = resolveTimezone(zone);
    assertValidTimezone(resolved);
    return resolved;
  });
  const range = parsed.rangeMs
    ? {
        startIso: new Date(parsed.rangeMs.startMs).toISOString(),
        endIso: new Date(parsed.rangeMs.endMs).toISOString(),
        durationMinutes: Math.round((parsed.rangeMs.endMs - parsed.rangeMs.startMs) / 60_000),
      }
    : undefined;

  const zoneRows = resolvedZones.map((zone) => {
    const base = formatZone(epochMs, zone);
    if (!parsed.rangeMs) return base;
    const start = formatZone(parsed.rangeMs.startMs, zone);
    const end = formatZone(parsed.rangeMs.endMs, zone);
    return { ...base, rangeTime: `${start.time} - ${end.time}` };
  });

  return {
    sourceIso: date.toISOString(),
    unixSeconds: Math.floor(epochMs / 1000),
    unixMilliseconds: epochMs,
    rfc2822: date.toUTCString(),
    rfc3339: date.toISOString(),
    zones: zoneRows,
    interpretedInput: parsed.interpretedInput,
    range,
  };
}

export function getPopularTimezones(): string[] {
  return [...DEFAULT_ZONES];
}
