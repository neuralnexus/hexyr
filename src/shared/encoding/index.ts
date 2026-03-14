const encoder = new TextEncoder();
const decoder = new TextDecoder();

const HEX_PAIRS = /^[0-9a-fA-F]{2}$/;
const BINARY_CHUNKS = /^[01]+$/;

export function textToBytes(input: string): Uint8Array {
  return encoder.encode(input);
}

export function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  const out = new Uint8Array(bytes.byteLength);
  out.set(bytes);
  return out.buffer;
}

export function bytesToText(bytes: Uint8Array): string {
  return decoder.decode(bytes);
}

export function isReadableText(value: string): boolean {
  if (value.includes('\uFFFD')) {
    return false;
  }

  for (const char of value) {
    const code = char.charCodeAt(0);
    if (
      (code >= 0 && code <= 8) ||
      (code >= 11 && code <= 12) ||
      (code >= 14 && code <= 31) ||
      code === 127
    ) {
      return false;
    }
  }

  return true;
}

export function normalizeHexInput(input: string): string {
  return input
    .replace(/0x/gi, '')
    .replace(/[^0-9a-fA-F]/g, '')
    .trim();
}

export function isValidHex(input: string): boolean {
  const cleaned = normalizeHexInput(input);
  return cleaned.length > 0 && cleaned.length % 2 === 0 && /^[0-9a-fA-F]+$/.test(cleaned);
}

export function hexToBytes(input: string): Uint8Array {
  const cleaned = normalizeHexInput(input);
  if (cleaned.length % 2 !== 0) {
    throw new Error('Hex input must contain an even number of characters');
  }

  const output = new Uint8Array(cleaned.length / 2);
  for (let i = 0; i < cleaned.length; i += 2) {
    const pair = cleaned.slice(i, i + 2);
    if (!HEX_PAIRS.test(pair)) {
      throw new Error(`Invalid hex pair: ${pair}`);
    }
    output[i / 2] = Number.parseInt(pair, 16);
  }
  return output;
}

export function bytesToHex(bytes: Uint8Array, uppercase = false): string {
  const value = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
  return uppercase ? value.toUpperCase() : value;
}

export function bytesToBinary(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) => byte.toString(2).padStart(8, '0')).join(' ');
}

export function binaryToBytes(input: string): Uint8Array {
  const cleaned = input.replace(/\s+/g, '').trim();
  if (cleaned.length === 0 || cleaned.length % 8 !== 0 || !BINARY_CHUNKS.test(cleaned)) {
    throw new Error('Binary input must be groups of 8 bits');
  }

  const out = new Uint8Array(cleaned.length / 8);
  for (let i = 0; i < cleaned.length; i += 8) {
    out[i / 8] = Number.parseInt(cleaned.slice(i, i + 8), 2);
  }
  return out;
}

export function isValidBinary(input: string): boolean {
  const cleaned = input.replace(/\s+/g, '').trim();
  return cleaned.length > 0 && cleaned.length % 8 === 0 && BINARY_CHUNKS.test(cleaned);
}

function toBase64(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
}

function fromBase64(input: string): Uint8Array {
  const binary = atob(input);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    out[i] = binary.charCodeAt(i);
  }
  return out;
}

export function bytesToBase64(bytes: Uint8Array, urlSafe = false): string {
  const base = toBase64(bytes);
  if (!urlSafe) {
    return base;
  }
  return base.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function base64ToBytes(input: string): Uint8Array {
  const normalized = input.replace(/-/g, '+').replace(/_/g, '/').replace(/\s+/g, '');
  if (!/^[A-Za-z0-9+/]*={0,2}$/.test(normalized)) {
    throw new Error('Invalid base64 input');
  }
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
  return fromBase64(padded);
}

export function textToBase64(input: string, urlSafe = false): string {
  return bytesToBase64(textToBytes(input), urlSafe);
}

export function base64ToText(input: string): string {
  return bytesToText(base64ToBytes(input));
}

export function urlEncode(input: string): string {
  return encodeURIComponent(input);
}

export function urlDecode(input: string): string {
  try {
    return decodeURIComponent(input.replace(/\+/g, '%20'));
  } catch {
    throw new Error('Malformed URL-encoded input');
  }
}

const encodeMap: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

const decodeMap: Record<string, string> = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#39;': "'",
};

export function htmlEncode(input: string): string {
  return input.replace(/[&<>"']/g, (ch) => encodeMap[ch]);
}

export function htmlDecode(input: string): string {
  return input.replace(/(&amp;|&lt;|&gt;|&quot;|&#39;)/g, (entity) => decodeMap[entity]);
}

export function inspectUnicode(input: string): {
  codePoints: string[];
  utf8Bytes: string[];
  utf16Units: string[];
} {
  const utf8 = textToBytes(input);
  const utf16Units = Array.from(input).map((char) =>
    char
      .split('')
      .map((unit) => unit.charCodeAt(0).toString(16).toUpperCase().padStart(4, '0'))
      .join(' '),
  );

  return {
    codePoints: Array.from(input).map(
      (char) => `U+${char.codePointAt(0)?.toString(16).toUpperCase()}`,
    ),
    utf8Bytes: Array.from(utf8, (byte) => byte.toString(16).toUpperCase().padStart(2, '0')),
    utf16Units,
  };
}

export function swapEndianness(hexInput: string): string {
  const bytes = hexToBytes(hexInput);
  return bytesToHex(Uint8Array.from(Array.from(bytes).reverse()));
}

export * from './bitwise';
