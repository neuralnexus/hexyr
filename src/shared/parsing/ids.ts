import { estimateEntropy } from '../analysis';

const ULID_ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
const BASE62_ALPHABET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
const KSUID_EPOCH_SECONDS = 1_400_000_000;

export interface IdInspectionResult {
  type: 'uuid' | 'ulid' | 'ksuid' | 'unknown';
  valid: boolean;
  version?: number;
  timestampIso?: string;
  entropyScore?: number;
  notes: string[];
}

function randomBytes(length: number): Uint8Array {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return bytes;
}

function bytesEntropy(input: Uint8Array): number {
  return estimateEntropy(input);
}

export function generateUuidV4(): string {
  if (typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  const bytes = randomBytes(16);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = [...bytes].map((x) => x.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

function encodeCrockford(value: bigint, length: number): string {
  let n = value;
  let out = '';
  for (let i = 0; i < length; i += 1) {
    out = ULID_ALPHABET[Number(n % 32n)] + out;
    n /= 32n;
  }
  return out;
}

function decodeCrockford(text: string): bigint {
  let out = 0n;
  for (const raw of text.toUpperCase()) {
    const idx = ULID_ALPHABET.indexOf(raw);
    if (idx < 0) throw new Error('Invalid ULID character');
    out = out * 32n + BigInt(idx);
  }
  return out;
}

export function generateUlid(timestampMs = Date.now()): string {
  const time = BigInt(timestampMs);
  const timePart = encodeCrockford(time, 10);
  const rand = randomBytes(10);
  let randBig = 0n;
  for (const byte of rand) randBig = (randBig << 8n) + BigInt(byte);
  const randPart = encodeCrockford(randBig, 16);
  return `${timePart}${randPart}`;
}

function encodeBase62(input: Uint8Array, length: number): string {
  let value = 0n;
  for (const byte of input) value = (value << 8n) + BigInt(byte);
  let out = '';
  for (let i = 0; i < length; i += 1) {
    out = BASE62_ALPHABET[Number(value % 62n)] + out;
    value /= 62n;
  }
  return out;
}

function decodeBase62(text: string): Uint8Array {
  let value = 0n;
  for (const ch of text) {
    const idx = BASE62_ALPHABET.indexOf(ch);
    if (idx < 0) throw new Error('Invalid KSUID character');
    value = value * 62n + BigInt(idx);
  }
  const out = new Uint8Array(20);
  for (let i = 19; i >= 0; i -= 1) {
    out[i] = Number(value & 0xffn);
    value >>= 8n;
  }
  return out;
}

export function generateKsuid(date = new Date()): string {
  const seconds = Math.floor(date.getTime() / 1000) - KSUID_EPOCH_SECONDS;
  const bytes = new Uint8Array(20);
  bytes[0] = (seconds >>> 24) & 0xff;
  bytes[1] = (seconds >>> 16) & 0xff;
  bytes[2] = (seconds >>> 8) & 0xff;
  bytes[3] = seconds & 0xff;
  bytes.set(randomBytes(16), 4);
  return encodeBase62(bytes, 27);
}

function inspectUuid(input: string): IdInspectionResult {
  const normalized = input.trim().toLowerCase();
  const match = normalized.match(/^[0-9a-f]{8}-[0-9a-f]{4}-([0-9a-f])[0-9a-f]{3}-[0-9a-f]{4}-[0-9a-f]{12}$/);
  if (!match) return { type: 'uuid', valid: false, notes: ['Invalid UUID format'] };
  const version = Number.parseInt(match[1], 16);
  const notes = [`UUID version ${version}`];
  return { type: 'uuid', valid: true, version, notes };
}

function inspectUlid(input: string): IdInspectionResult {
  if (!/^[0-9A-HJKMNP-TV-Z]{26}$/i.test(input)) {
    return { type: 'ulid', valid: false, notes: ['Invalid ULID format'] };
  }
  const upper = input.toUpperCase();
  const ts = Number(decodeCrockford(upper.slice(0, 10)));
  const randRaw = upper.slice(10);
  const randBytes = new Uint8Array(randRaw.length);
  for (let i = 0; i < randRaw.length; i += 1) randBytes[i] = ULID_ALPHABET.indexOf(randRaw[i]);
  return {
    type: 'ulid',
    valid: true,
    timestampIso: new Date(ts).toISOString(),
    entropyScore: bytesEntropy(randBytes),
    notes: ['ULID timestamp extracted from first 48 bits'],
  };
}

function inspectKsuid(input: string): IdInspectionResult {
  if (!/^[0-9A-Za-z]{27}$/.test(input)) {
    return { type: 'ksuid', valid: false, notes: ['Invalid KSUID format'] };
  }
  let bytes: Uint8Array;
  try {
    bytes = decodeBase62(input);
  } catch {
    return { type: 'ksuid', valid: false, notes: ['Invalid KSUID encoding'] };
  }
  const seconds = ((bytes[0] << 24) | (bytes[1] << 16) | (bytes[2] << 8) | bytes[3]) + KSUID_EPOCH_SECONDS;
  return {
    type: 'ksuid',
    valid: true,
    timestampIso: new Date(seconds * 1000).toISOString(),
    entropyScore: bytesEntropy(bytes.slice(4)),
    notes: ['KSUID timestamp extracted from first 32 bits'],
  };
}

export function inspectId(input: string): IdInspectionResult {
  const text = input.trim();
  if (text.includes('-') && text.length === 36) return inspectUuid(text);
  if (text.length === 26) return inspectUlid(text);
  if (text.length === 27) return inspectKsuid(text);
  return { type: 'unknown', valid: false, notes: ['Could not classify ID format'] };
}
