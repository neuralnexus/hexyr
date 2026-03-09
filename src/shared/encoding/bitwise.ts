import { binaryToBytes, bytesToBinary, bytesToHex, hexToBytes } from '.';

export type BitwiseOp = 'AND' | 'OR' | 'XOR';

function parseInput(input: string): Uint8Array {
  const clean = input.trim();
  if (/^[01\s]+$/.test(clean)) {
    const compact = clean.replace(/\s+/g, '');
    if (compact.length > 0 && compact.length % 8 === 0) {
      return binaryToBytes(clean);
    }
  }
  return hexToBytes(clean);
}

export function bitwiseBinary(left: string, right: string, op: BitwiseOp): string {
  const a = parseInput(left);
  const b = parseInput(right);
  const len = Math.min(a.length, b.length);
  const out = new Uint8Array(len);

  for (let i = 0; i < len; i += 1) {
    if (op === 'AND') {
      out[i] = a[i] & b[i];
    } else if (op === 'OR') {
      out[i] = a[i] | b[i];
    } else {
      out[i] = a[i] ^ b[i];
    }
  }

  return bytesToBinary(out);
}

export function bitwiseNot(input: string): string {
  const bytes = parseInput(input);
  return bytesToHex(Uint8Array.from(Array.from(bytes, (x) => ~x & 0xff)));
}

export function shiftLeft(input: string, bits: number): string {
  const bytes = parseInput(input);
  const out = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i += 1) {
    out[i] = (bytes[i] << bits) & 0xff;
  }
  return bytesToHex(out);
}

export function shiftRight(input: string, bits: number): string {
  const bytes = parseInput(input);
  const out = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i += 1) {
    out[i] = bytes[i] >> bits;
  }
  return bytesToHex(out);
}
