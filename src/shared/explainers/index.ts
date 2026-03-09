import { detectFormats, isLikelyBase64 } from '../detection';
import { normalizeHexInput } from '../encoding';

export function explainHexDump(input: string): string {
  const normalized = normalizeHexInput(input);
  if (!normalized) {
    return 'No hex bytes detected. Paste a hex string to inspect grouped byte output.';
  }
  if (normalized.length % 2 !== 0) {
    return 'This hex string has odd length, which means at least one byte is incomplete.';
  }
  const byteCount = normalized.length / 2;
  const prefix = normalized.slice(0, 8).toLowerCase();
  if (prefix === '89504e47') {
    return `This payload starts with PNG magic bytes and contains ${byteCount} bytes.`;
  }
  return `Detected ${byteCount} bytes of valid hex. You can view offset groups and ASCII side-by-side.`;
}

export function suggestDecodingStrategies(input: string): string {
  const compactBinary = input.replace(/\s+/g, '');
  if (/^[01]+$/.test(compactBinary) && compactBinary.length % 8 === 0 && compactBinary.length >= 8) {
    return 'Likely binary bitstring. Group into bytes first, then render hex and UTF-8 views.';
  }

  if (isLikelyBase64(input)) {
    return 'Likely base64 text. Try decoding to UTF-8 and then inspect for JSON or binary signatures.';
  }

  const [top] = detectFormats(input);
  switch (top?.format) {
    case 'jwt':
      return 'Likely JWT. Split into header/payload/signature and decode header/payload as JSON.';
    case 'base64':
    case 'base64url':
      return 'Likely base64 text. Try decoding to UTF-8 and then inspect for JSON or binary signatures.';
    case 'hex':
      return 'Likely hex input. Decode to bytes, inspect magic bytes, then try UTF-8 rendering if printable.';
    case 'binary':
      return 'Likely binary bitstring. Group into bytes first, then render hex and UTF-8 views.';
    default:
      return 'Treat as UTF-8 text first, then test URL decoding and base64 heuristics.';
  }
}
