import {
  base64ToBytes,
  binaryToBytes,
  bytesToHex,
  hexToBytes,
  isValidBinary,
  isValidHex,
  textToBytes,
} from '../encoding';

export interface HexdumpOptions {
  bytesPerLine: number;
  uppercase: boolean;
  offsetBase: 10 | 16;
}

export type ByteInputEncoding = 'auto' | 'text' | 'hex' | 'base64' | 'binary';
export type ByteColorMode = 'nibble' | 'semantic' | 'none';
export type ByteSemanticGroup = 'null' | 'control' | 'whitespace' | 'printable' | 'non-ascii';

export interface DecodedByteInput {
  bytes: Uint8Array;
  detectedEncoding: Exclude<ByteInputEncoding, 'auto'>;
}

export interface HexdumpCell {
  index: number;
  value: number;
  hex: string;
  ascii: string;
  nibble: string;
  semanticGroup: ByteSemanticGroup;
}

export interface HexdumpRow {
  offset: number;
  offsetLabel: string;
  cells: HexdumpCell[];
}

export interface ByteSummary {
  byteCount: number;
  entropy: number;
  nullCount: number;
  printableCount: number;
  uniqueCount: number;
  mostCommon: Array<{ value: number; count: number }>;
}

const PRINTABLE_MIN = 32;
const PRINTABLE_MAX = 126;
const WHITESPACE_BYTES = new Set([0x09, 0x0a, 0x0b, 0x0c, 0x0d, 0x20]);

function hexByte(value: number, uppercase: boolean): string {
  const output = value.toString(16).padStart(2, '0');
  return uppercase ? output.toUpperCase() : output;
}

export function byteToAscii(value: number): string {
  return value >= PRINTABLE_MIN && value <= PRINTABLE_MAX ? String.fromCharCode(value) : '.';
}

export function getByteSemanticGroup(value: number): ByteSemanticGroup {
  if (value === 0) {
    return 'null';
  }
  if (WHITESPACE_BYTES.has(value)) {
    return 'whitespace';
  }
  if (value < PRINTABLE_MIN || value === 0x7f) {
    return 'control';
  }
  if (value <= PRINTABLE_MAX) {
    return 'printable';
  }
  return 'non-ascii';
}

export function decodeByteInput(input: string, encoding: ByteInputEncoding): DecodedByteInput {
  if (!input) {
    return { bytes: new Uint8Array(), detectedEncoding: encoding === 'auto' ? 'text' : encoding };
  }

  if (encoding === 'text') {
    return { bytes: textToBytes(input), detectedEncoding: 'text' };
  }
  if (encoding === 'hex') {
    return { bytes: hexToBytes(input), detectedEncoding: 'hex' };
  }
  if (encoding === 'base64') {
    return { bytes: base64ToBytes(input), detectedEncoding: 'base64' };
  }
  if (encoding === 'binary') {
    return { bytes: binaryToBytes(input), detectedEncoding: 'binary' };
  }

  const trimmed = input.trim();
  if (isValidBinary(trimmed)) {
    return { bytes: binaryToBytes(trimmed), detectedEncoding: 'binary' };
  }
  if (isValidHex(trimmed)) {
    return { bytes: hexToBytes(trimmed), detectedEncoding: 'hex' };
  }
  if (/[-_+/=]/.test(trimmed)) {
    try {
      return { bytes: base64ToBytes(trimmed), detectedEncoding: 'base64' };
    } catch {
      // Treat ambiguous input as text rather than silently discarding it.
    }
  }
  return { bytes: textToBytes(input), detectedEncoding: 'text' };
}

export function buildHexdumpRows(
  input: Uint8Array,
  options: HexdumpOptions,
  start = 0,
  end = input.length,
): HexdumpRow[] {
  if (!Number.isInteger(options.bytesPerLine) || options.bytesPerLine <= 0) {
    throw new Error('Bytes per line must be a positive integer');
  }

  const first = Math.max(0, Math.min(start, input.length));
  const last = Math.max(first, Math.min(end, input.length));
  const rows: HexdumpRow[] = [];

  for (let offset = first; offset < last; offset += options.bytesPerLine) {
    const limit = Math.min(offset + options.bytesPerLine, last);
    const cells: HexdumpCell[] = [];
    for (let index = offset; index < limit; index += 1) {
      const value = input[index];
      cells.push({
        index,
        value,
        hex: hexByte(value, options.uppercase),
        ascii: byteToAscii(value),
        nibble: value.toString(16).at(0)?.toUpperCase() ?? '0',
        semanticGroup: getByteSemanticGroup(value),
      });
    }

    rows.push({
      offset,
      offsetLabel:
        options.offsetBase === 16
          ? offset.toString(16).padStart(8, '0')
          : offset.toString(10).padStart(8, '0'),
      cells,
    });
  }

  return rows;
}

export function summarizeBytes(input: Uint8Array): ByteSummary {
  if (input.length === 0) {
    return {
      byteCount: 0,
      entropy: 0,
      nullCount: 0,
      printableCount: 0,
      uniqueCount: 0,
      mostCommon: [],
    };
  }

  const frequencies = new Array<number>(256).fill(0);
  let nullCount = 0;
  let printableCount = 0;
  for (const byte of input) {
    frequencies[byte] += 1;
    if (byte === 0) {
      nullCount += 1;
    }
    if (byte >= PRINTABLE_MIN && byte <= PRINTABLE_MAX) {
      printableCount += 1;
    }
  }

  let entropy = 0;
  for (const count of frequencies) {
    if (count > 0) {
      const probability = count / input.length;
      entropy -= probability * Math.log2(probability);
    }
  }

  const mostCommon = frequencies
    .map((count, value) => ({ value, count }))
    .filter(({ count }) => count > 0)
    .sort((a, b) => b.count - a.count || a.value - b.value)
    .slice(0, 4);

  return {
    byteCount: input.length,
    entropy: Number(entropy.toFixed(4)),
    nullCount,
    printableCount,
    uniqueCount: mostCommon.length === 0 ? 0 : frequencies.filter((count) => count > 0).length,
    mostCommon,
  };
}

export function findByteSequence(
  input: Uint8Array,
  needle: Uint8Array,
  limit = Number.POSITIVE_INFINITY,
): number[] {
  if (needle.length === 0 || needle.length > input.length) {
    return [];
  }

  const matches: number[] = [];
  outer: for (let offset = 0; offset <= input.length - needle.length; offset += 1) {
    for (let cursor = 0; cursor < needle.length; cursor += 1) {
      if (input[offset + cursor] !== needle[cursor]) {
        continue outer;
      }
    }
    matches.push(offset);
    if (matches.length >= limit) {
      break;
    }
  }
  return matches;
}

export function getByteColorToken(value: number, mode: ByteColorMode): string | null {
  if (mode === 'none') {
    return null;
  }
  if (mode === 'semantic') {
    return `var(--byte-${getByteSemanticGroup(value)})`;
  }
  if (value === 0) {
    return 'var(--byte-00)';
  }
  if (value === 0xff) {
    return 'var(--byte-ff)';
  }
  return `var(--byte-${value.toString(16).at(0)})`;
}

export function formatHexdump(
  input: Uint8Array,
  options: HexdumpOptions,
  start = 0,
  end = input.length,
): string {
  return buildHexdumpRows(input, options, start, end)
    .map((row) => {
      const hex =
        bytesToHex(Uint8Array.from(row.cells.map((cell) => cell.value)), options.uppercase)
          .match(/.{1,2}/g)
          ?.join(' ') ?? '';
      const ascii = row.cells.map((cell) => cell.ascii).join('');
      return `${row.offsetLabel}  ${hex.padEnd(options.bytesPerLine * 3 - 1, ' ')}  ${ascii}`;
    })
    .join('\n');
}
