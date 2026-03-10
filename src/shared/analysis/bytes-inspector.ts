import { base64ToBytes, hexToBytes, isValidHex } from '../encoding';

export interface ByteInspection {
  cbor: string[];
  messagePack: string[];
  protobuf: string[];
}

export function parseInputBytes(input: string): Uint8Array {
  const trimmed = input.trim();
  if (!trimmed) {
    return new Uint8Array();
  }
  if (isValidHex(trimmed)) {
    return hexToBytes(trimmed);
  }
  try {
    return base64ToBytes(trimmed);
  } catch {
    return new TextEncoder().encode(input);
  }
}

export function inspectCbor(bytes: Uint8Array): string[] {
  const out: string[] = [];
  for (let i = 0; i < Math.min(bytes.length, 64); i += 1) {
    const b = bytes[i];
    const major = b >> 5;
    const ai = b & 0x1f;
    out.push(`offset ${i}: major=${major} additional=${ai}`);
  }
  if (out.length === 0) {
    out.push('No CBOR bytes to inspect');
  }
  return out;
}

export function inspectMessagePack(bytes: Uint8Array): string[] {
  const out: string[] = [];
  for (let i = 0; i < Math.min(bytes.length, 64); i += 1) {
    const b = bytes[i];
    if (b <= 0x7f) out.push(`offset ${i}: positive fixint ${b}`);
    else if (b >= 0xe0) out.push(`offset ${i}: negative fixint ${b - 256}`);
    else if ((b & 0xf0) === 0x80) out.push(`offset ${i}: fixmap size ${b & 0x0f}`);
    else if ((b & 0xf0) === 0x90) out.push(`offset ${i}: fixarray size ${b & 0x0f}`);
    else if ((b & 0xe0) === 0xa0) out.push(`offset ${i}: fixstr length ${b & 0x1f}`);
    else out.push(`offset ${i}: marker 0x${b.toString(16).padStart(2, '0')}`);
  }
  if (out.length === 0) {
    out.push('No MessagePack bytes to inspect');
  }
  return out;
}

function readVarint(bytes: Uint8Array, offset: number): { value: number; next: number } {
  let value = 0;
  let shift = 0;
  let cursor = offset;
  while (cursor < bytes.length) {
    const b = bytes[cursor];
    value |= (b & 0x7f) << shift;
    cursor += 1;
    if ((b & 0x80) === 0) {
      return { value, next: cursor };
    }
    shift += 7;
    if (shift > 35) {
      break;
    }
  }
  return { value: 0, next: bytes.length };
}

export function inspectProtobuf(bytes: Uint8Array): string[] {
  const out: string[] = [];
  let offset = 0;
  while (offset < bytes.length && out.length < 64) {
    const tag = readVarint(bytes, offset);
    if (tag.next <= offset) break;
    const fieldNumber = tag.value >> 3;
    const wireType = tag.value & 0x07;
    offset = tag.next;

    if (wireType === 0) {
      const value = readVarint(bytes, offset);
      out.push(`field ${fieldNumber} varint=${value.value}`);
      offset = value.next;
    } else if (wireType === 1) {
      out.push(`field ${fieldNumber} fixed64`);
      offset += 8;
    } else if (wireType === 2) {
      const length = readVarint(bytes, offset);
      out.push(`field ${fieldNumber} len=${length.value}`);
      offset = length.next + length.value;
    } else if (wireType === 5) {
      out.push(`field ${fieldNumber} fixed32`);
      offset += 4;
    } else {
      out.push(`field ${fieldNumber} unsupported wire type=${wireType}`);
      break;
    }
  }
  if (out.length === 0) {
    out.push('No Protobuf fields detected');
  }
  return out;
}

export function inspectBytes(input: string): ByteInspection {
  const bytes = parseInputBytes(input);
  return {
    cbor: inspectCbor(bytes),
    messagePack: inspectMessagePack(bytes),
    protobuf: inspectProtobuf(bytes),
  };
}
