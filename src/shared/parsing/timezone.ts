export interface TimezoneConversion {
  zone: string;
  iso: string;
  date: string;
  time: string;
  offset: string;
  weekday: string;
}

export interface TimezoneLabResult {
  sourceIso: string;
  unixSeconds: number;
  unixMilliseconds: number;
  rfc2822: string;
  rfc3339: string;
  zones: TimezoneConversion[];
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

function zonedWallTimeToEpochMs(input: string, sourceZone: string): number {
  const wall = parseWallTime(input);
  if (!wall) throw new Error('Invalid wall time. Use YYYY-MM-DDTHH:mm:ss');

  let epoch = Date.UTC(wall.year, wall.month - 1, wall.day, wall.hour, wall.minute, wall.second);
  for (let i = 0; i < 4; i += 1) {
    const offset = getOffsetMinutes(epoch, sourceZone);
    epoch = Date.UTC(wall.year, wall.month - 1, wall.day, wall.hour, wall.minute, wall.second) - offset * 60_000;
  }
  return epoch;
}

function parseInputToEpoch(input: string, sourceZone?: string): number {
  const trimmed = input.trim();
  if (!trimmed) throw new Error('Timestamp input is required');

  if (/^\d+$/.test(trimmed)) {
    const n = Number.parseInt(trimmed, 10);
    return n < 1_000_000_000_000 ? n * 1000 : n;
  }

  if (!/[zZ]|[+-]\d{2}:?\d{2}$/.test(trimmed) && sourceZone) {
    const resolvedSource = resolveTimezone(sourceZone);
    assertValidTimezone(resolvedSource);
    return zonedWallTimeToEpochMs(trimmed, resolvedSource);
  }

  const parsed = Date.parse(trimmed);
  if (Number.isNaN(parsed)) throw new Error('Invalid timestamp input');
  return parsed;
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
  const epochMs = parseInputToEpoch(input, sourceZone);
  const date = new Date(epochMs);
  const resolvedZones = zones.map((zone) => {
    const resolved = resolveTimezone(zone);
    assertValidTimezone(resolved);
    return resolved;
  });
  return {
    sourceIso: date.toISOString(),
    unixSeconds: Math.floor(epochMs / 1000),
    unixMilliseconds: epochMs,
    rfc2822: date.toUTCString(),
    rfc3339: date.toISOString(),
    zones: resolvedZones.map((zone) => formatZone(epochMs, zone)),
  };
}

export function getPopularTimezones(): string[] {
  return [...DEFAULT_ZONES];
}
