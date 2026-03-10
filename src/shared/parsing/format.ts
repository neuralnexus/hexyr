import { XMLBuilder, XMLParser, XMLValidator } from 'fast-xml-parser';
import { dump, load } from 'js-yaml';
import { parse as parseToml, stringify as stringifyToml } from 'smol-toml';
import { format as formatSql } from 'sql-formatter';

export type StructuredFormat = 'json' | 'yaml' | 'toml';
export type FormatterKind = 'json' | 'yaml' | 'toml' | 'xml' | 'ini' | 'sql' | 'http';

function normalizeJson(input: string): unknown {
  try {
    return JSON.parse(input);
  } catch (err) {
    throw new Error(err instanceof Error ? `Invalid JSON: ${err.message}` : 'Invalid JSON');
  }
}

function normalizeYaml(input: string): unknown {
  try {
    return load(input);
  } catch (err) {
    throw new Error(err instanceof Error ? `Invalid YAML: ${err.message}` : 'Invalid YAML');
  }
}

function normalizeToml(input: string): unknown {
  try {
    return parseToml(input);
  } catch (err) {
    throw new Error(err instanceof Error ? `Invalid TOML: ${err.message}` : 'Invalid TOML');
  }
}

function parseStructured(input: string, format: StructuredFormat): unknown {
  if (format === 'json') return normalizeJson(input);
  if (format === 'yaml') return normalizeYaml(input);
  return normalizeToml(input);
}

function stringifyStructured(input: unknown, format: StructuredFormat): string {
  if (format === 'json') return `${JSON.stringify(input, null, 2)}\n`;
  if (format === 'yaml') {
    return dump(input, {
      indent: 2,
      lineWidth: 120,
      noRefs: true,
      sortKeys: false,
    });
  }
  return stringifyToml(input as Record<string, unknown>);
}

function normalizeXml(input: string): unknown {
  const valid = XMLValidator.validate(input);
  if (valid !== true) {
    throw new Error(`Invalid XML: ${valid.err.msg}`);
  }
  const parser = new XMLParser({ ignoreAttributes: false, trimValues: true });
  return parser.parse(input);
}

function parseIniLine(line: string): { key: string; value: string } {
  const idx = line.indexOf('=');
  if (idx < 1) throw new Error(`Invalid INI/.env line: ${line}`);
  const key = line.slice(0, idx).trim();
  const value = line.slice(idx + 1).trim();
  if (!key) throw new Error(`Invalid INI/.env line: ${line}`);
  return { key, value };
}

function formatIni(input: string): string {
  const lines = input.split(/\r?\n/);
  const groups: Array<{ section: string; items: Array<{ key: string; value: string }> }> = [];
  let current = { section: '', items: [] as Array<{ key: string; value: string }> };

  for (const raw of lines) {
    const line = raw.trim();
    if (!line || line.startsWith('#') || line.startsWith(';')) continue;
    if (/^\[[^\]]+\]$/.test(line)) {
      groups.push(current);
      current = { section: line, items: [] };
      continue;
    }
    current.items.push(parseIniLine(line));
  }
  groups.push(current);

  const out: string[] = [];
  for (const group of groups) {
    if (group.section) out.push(group.section);
    for (const item of group.items.sort((a, b) => a.key.localeCompare(b.key))) {
      out.push(`${item.key}=${item.value}`);
    }
    if (group.section || group.items.length > 0) out.push('');
  }
  return out.join('\n').trimEnd() + '\n';
}

function minifyWhitespace(input: string): string {
  return input.replace(/\s+/g, ' ').trim();
}

function formatHttp(input: string): string {
  const lines = input.split(/\r?\n/);
  if (lines.length === 0 || !lines[0].trim()) throw new Error('HTTP message must start with request/status line');

  const startLine = lines[0].trim();
  const headers: Array<{ name: string; value: string }> = [];
  let idx = 1;
  while (idx < lines.length) {
    const line = lines[idx];
    if (line.trim() === '') {
      idx += 1;
      break;
    }
    const sep = line.indexOf(':');
    if (sep < 1) throw new Error(`Invalid HTTP header line: ${line}`);
    const name = line.slice(0, sep).trim().toLowerCase().replace(/(^.|-.)/g, (m) => m.toUpperCase());
    const value = line.slice(sep + 1).trim();
    headers.push({ name, value });
    idx += 1;
  }
  const body = lines.slice(idx).join('\n').trimEnd();
  const headerLines = headers.map((header) => `${header.name}: ${header.value}`).join('\n');
  return [startLine, headerLines, '', body].filter((part, i) => i < 3 || part.length > 0).join('\n');
}

export function formatStructured(input: string, format: StructuredFormat): string {
  return stringifyStructured(parseStructured(input, format), format);
}

export function minifyStructured(input: string, format: StructuredFormat): string {
  const parsed = parseStructured(input, format);
  return JSON.stringify(parsed);
}

export function validateStructured(input: string, format: StructuredFormat): { ok: boolean; message: string } {
  parseStructured(input, format);
  return { ok: true, message: `${format.toUpperCase()} is valid` };
}

export function convertStructured(input: string, from: StructuredFormat, to: StructuredFormat): string {
  return stringifyStructured(parseStructured(input, from), to);
}

export function formatByKind(input: string, kind: FormatterKind): string {
  if (kind === 'json' || kind === 'yaml' || kind === 'toml') return formatStructured(input, kind);
  if (kind === 'xml') {
    const parsed = normalizeXml(input);
    const builder = new XMLBuilder({ ignoreAttributes: false, format: true, indentBy: '  ' });
    return builder.build(parsed);
  }
  if (kind === 'ini') return formatIni(input);
  if (kind === 'sql') return formatSql(input, { language: 'sql' });
  return formatHttp(input);
}

export function minifyByKind(input: string, kind: FormatterKind): string {
  if (kind === 'json' || kind === 'yaml' || kind === 'toml') return minifyStructured(input, kind);
  if (kind === 'xml') {
    const parsed = normalizeXml(input);
    const builder = new XMLBuilder({ ignoreAttributes: false, format: false });
    return builder.build(parsed);
  }
  if (kind === 'ini') return formatIni(input).trim();
  if (kind === 'sql') return minifyWhitespace(input);
  return minifyWhitespace(input);
}

export function validateByKind(input: string, kind: FormatterKind): { ok: boolean; message: string } {
  if (kind === 'json' || kind === 'yaml' || kind === 'toml') return validateStructured(input, kind);
  if (kind === 'xml') {
    normalizeXml(input);
    return { ok: true, message: 'XML is valid' };
  }
  if (kind === 'ini') {
    formatIni(input);
    return { ok: true, message: 'INI/.env structure is valid' };
  }
  if (kind === 'sql') {
    formatSql(input, { language: 'sql' });
    return { ok: true, message: 'SQL is syntactically parseable' };
  }
  formatHttp(input);
  return { ok: true, message: 'HTTP message structure is valid' };
}
