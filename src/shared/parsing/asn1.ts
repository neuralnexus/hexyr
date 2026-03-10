import { base64ToBytes, hexToBytes, isValidHex } from '../encoding';

export interface Asn1Node {
  tagClass: string;
  constructed: boolean;
  tagNumber: number;
  offset: number;
  length: number;
  valuePreview: string;
  children: Asn1Node[];
}

function inputToBytes(input: string): Uint8Array {
  const trimmed = input.trim();
  if (!trimmed) return new Uint8Array();
  if (isValidHex(trimmed)) return hexToBytes(trimmed);
  try {
    return base64ToBytes(trimmed);
  } catch {
    return new TextEncoder().encode(trimmed);
  }
}

function parseLength(bytes: Uint8Array, offset: number): { length: number; bytesRead: number } {
  const first = bytes[offset];
  if ((first & 0x80) === 0) {
    return { length: first, bytesRead: 1 };
  }
  const count = first & 0x7f;
  let len = 0;
  for (let i = 0; i < count; i += 1) {
    len = (len << 8) | bytes[offset + 1 + i];
  }
  return { length: len, bytesRead: 1 + count };
}

function tagClassName(value: number): string {
  switch (value) {
    case 0:
      return 'universal';
    case 1:
      return 'application';
    case 2:
      return 'context';
    default:
      return 'private';
  }
}

function parseNode(bytes: Uint8Array, offset: number): { node: Asn1Node; next: number } {
  const tag = bytes[offset];
  const cls = tagClassName((tag & 0b11000000) >> 6);
  const constructed = (tag & 0b00100000) !== 0;
  const tagNumber = tag & 0b00011111;

  const { length, bytesRead } = parseLength(bytes, offset + 1);
  const start = offset + 1 + bytesRead;
  const end = Math.min(bytes.length, start + length);
  const value = bytes.slice(start, end);

  const node: Asn1Node = {
    tagClass: cls,
    constructed,
    tagNumber,
    offset,
    length,
    valuePreview: Array.from(value.slice(0, 12), (b) => b.toString(16).padStart(2, '0')).join(' '),
    children: [],
  };

  if (constructed) {
    let cursor = start;
    while (cursor < end) {
      const parsed = parseNode(bytes, cursor);
      node.children.push(parsed.node);
      if (parsed.next <= cursor) break;
      cursor = parsed.next;
    }
  }

  return { node, next: end };
}

export function parseAsn1(input: string): Asn1Node[] {
  const bytes = inputToBytes(input);
  const nodes: Asn1Node[] = [];
  let cursor = 0;
  while (cursor < bytes.length) {
    const parsed = parseNode(bytes, cursor);
    nodes.push(parsed.node);
    if (parsed.next <= cursor) break;
    cursor = parsed.next;
  }
  return nodes;
}
