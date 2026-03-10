export interface DnsZoneRecord {
  name: string;
  ttl?: number;
  cls: string;
  type: string;
  value: string;
  raw: string;
  line: number;
}

export interface DnsZoneParseResult {
  records: DnsZoneRecord[];
  origin?: string;
  defaultTtl?: number;
  errors: string[];
  warnings: string[];
}

const IPV4_RE = /^(?:25[0-5]|2[0-4]\d|1?\d?\d)(?:\.(?:25[0-5]|2[0-4]\d|1?\d?\d)){3}$/;
const IPV6_RE = /^[0-9a-fA-F:]+$/;

function stripComment(line: string): string {
  const idx = line.indexOf(';');
  return idx >= 0 ? line.slice(0, idx) : line;
}

function normalizeZoneInput(zoneText: string): Array<{ line: number; text: string }> {
  const lines = zoneText.split(/\r?\n/);
  const out: Array<{ line: number; text: string }> = [];
  let pending = '';
  let pendingLine = 1;
  let depth = 0;

  for (let i = 0; i < lines.length; i += 1) {
    const raw = stripComment(lines[i]).trim();
    if (!raw) continue;
    if (!pending) pendingLine = i + 1;
    pending = pending ? `${pending} ${raw}` : raw;
    depth += (raw.match(/\(/g) ?? []).length;
    depth -= (raw.match(/\)/g) ?? []).length;
    if (depth <= 0) {
      out.push({ line: pendingLine, text: pending.replace(/[()]/g, ' ').replace(/\s+/g, ' ').trim() });
      pending = '';
      depth = 0;
    }
  }
  if (pending) {
    out.push({ line: pendingLine, text: pending.replace(/[()]/g, ' ').replace(/\s+/g, ' ').trim() });
  }
  return out;
}

function isType(token: string): boolean {
  return ['A', 'AAAA', 'CNAME', 'MX', 'TXT', 'NS', 'SOA', 'SRV', 'CAA', 'PTR'].includes(token.toUpperCase());
}

function isClass(token: string): boolean {
  return ['IN', 'CH', 'HS'].includes(token.toUpperCase());
}

function isTtl(token: string): boolean {
  return /^\d+$/.test(token);
}

function validateRdata(record: DnsZoneRecord): string[] {
  const errors: string[] = [];
  const type = record.type.toUpperCase();
  const value = record.value.trim();

  if (type === 'A' && !IPV4_RE.test(value)) errors.push(`line ${record.line}: invalid A record IPv4 address`);
  if (type === 'AAAA' && !IPV6_RE.test(value)) errors.push(`line ${record.line}: invalid AAAA record IPv6 address`);
  if (type === 'CNAME' && !value) errors.push(`line ${record.line}: CNAME target is empty`);
  if (type === 'NS' && !value) errors.push(`line ${record.line}: NS target is empty`);
  if (type === 'PTR' && !value) errors.push(`line ${record.line}: PTR target is empty`);

  if (type === 'MX') {
    const [pref, host] = value.split(/\s+/, 2);
    if (!pref || !/^\d+$/.test(pref) || !host) {
      errors.push(`line ${record.line}: MX must be "<preference> <host>"`);
    }
  }

  if (type === 'SRV') {
    const parts = value.split(/\s+/);
    if (parts.length < 4 || parts.slice(0, 3).some((x) => !/^\d+$/.test(x))) {
      errors.push(`line ${record.line}: SRV must be "<priority> <weight> <port> <target>"`);
    }
  }

  if (type === 'CAA') {
    const parts = value.match(/^(\d+)\s+([A-Za-z0-9_-]+)\s+"([^"]+)"$/);
    if (!parts) {
      errors.push(`line ${record.line}: CAA must be "<flag> <tag> 'value'"`);
    }
  }

  return errors;
}

export function parseZoneFile(zoneText: string): DnsZoneParseResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const records: DnsZoneRecord[] = [];
  const logicalLines = normalizeZoneInput(zoneText);

  let origin: string | undefined;
  let defaultTtl: number | undefined;

  for (const line of logicalLines) {
    if (line.text.startsWith('$ORIGIN')) {
      origin = line.text.replace(/^\$ORIGIN\s+/i, '').trim();
      continue;
    }
    if (line.text.startsWith('$TTL')) {
      const value = line.text.replace(/^\$TTL\s+/i, '').trim();
      if (!isTtl(value)) {
        errors.push(`line ${line.line}: invalid $TTL value`);
      } else {
        defaultTtl = Number.parseInt(value, 10);
      }
      continue;
    }

    const tokens = line.text.split(/\s+/);
    if (tokens.length < 2) {
      errors.push(`line ${line.line}: incomplete record`);
      continue;
    }

    let index = 0;
    const name = tokens[index] ?? '@';
    index += 1;

    let ttl: number | undefined;
    let cls = 'IN';
    if (isTtl(tokens[index] ?? '')) {
      ttl = Number.parseInt(tokens[index], 10);
      index += 1;
    }
    if (isClass(tokens[index] ?? '')) {
      cls = tokens[index].toUpperCase();
      index += 1;
    }

    const type = (tokens[index] ?? '').toUpperCase();
    index += 1;
    if (!isType(type)) {
      errors.push(`line ${line.line}: unsupported or missing record type`);
      continue;
    }

    const value = tokens.slice(index).join(' ').trim();
    if (!value) {
      errors.push(`line ${line.line}: missing record value`);
      continue;
    }

    const record: DnsZoneRecord = { name, ttl, cls, type, value, raw: line.text, line: line.line };
    errors.push(...validateRdata(record));

    const effectiveTtl = ttl ?? defaultTtl;
    if (effectiveTtl !== undefined) {
      if (effectiveTtl < 30) warnings.push(`line ${line.line}: TTL ${effectiveTtl}s is very low`);
      if (effectiveTtl > 60 * 60 * 24 * 7) warnings.push(`line ${line.line}: TTL ${effectiveTtl}s is very high`);
    } else {
      warnings.push(`line ${line.line}: no TTL defined for record`);
    }

    records.push(record);
  }

  return { records, origin, defaultTtl, errors, warnings };
}

export function formatZoneFile(records: DnsZoneRecord[], origin?: string, defaultTtl?: number): string {
  const lines: string[] = [];
  if (origin) lines.push(`$ORIGIN ${origin}`);
  if (defaultTtl !== undefined) lines.push(`$TTL ${defaultTtl}`);
  if (lines.length > 0) lines.push('');

  for (const record of records) {
    const ttlPart = record.ttl !== undefined ? `${record.ttl} ` : '';
    lines.push(`${record.name} ${ttlPart}${record.cls} ${record.type} ${record.value}`.replace(/\s+/g, ' ').trim());
  }
  return lines.join('\n');
}
