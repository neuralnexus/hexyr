import { base64ToBytes, bytesToHex, hexToBytes, isValidHex, textToBytes } from '../encoding';

export type DiffEncoding = 'text' | 'hex' | 'base64';

export interface DiffResult {
  leftLength: number;
  rightLength: number;
  equalBytes: number;
  similarity: number;
  firstDiffOffset: number;
  preview: string[];
}

function toBytes(input: string, encoding: DiffEncoding): Uint8Array {
  if (encoding === 'text') return textToBytes(input);
  if (encoding === 'hex') return isValidHex(input) ? hexToBytes(input) : textToBytes(input);
  try {
    return base64ToBytes(input);
  } catch {
    return textToBytes(input);
  }
}

export function comparePayloads(left: string, right: string, encoding: DiffEncoding): DiffResult {
  const a = toBytes(left, encoding);
  const b = toBytes(right, encoding);
  const max = Math.max(a.length, b.length);
  const min = Math.min(a.length, b.length);
  let equal = 0;
  let firstDiff = -1;

  for (let i = 0; i < min; i += 1) {
    if (a[i] === b[i]) equal += 1;
    else if (firstDiff === -1) firstDiff = i;
  }

  if (firstDiff === -1 && a.length !== b.length) {
    firstDiff = min;
  }

  const preview: string[] = [];
  const start = Math.max(0, (firstDiff === -1 ? 0 : firstDiff) - 8);
  const end = Math.min(max, start + 24);
  for (let i = start; i < end; i += 8) {
    const leftSlice = a.slice(i, i + 8);
    const rightSlice = b.slice(i, i + 8);
    preview.push(
      `${i.toString(16).padStart(6, '0')}  L:${bytesToHex(leftSlice).padEnd(16, ' ')}  R:${bytesToHex(rightSlice).padEnd(16, ' ')}`,
    );
  }

  return {
    leftLength: a.length,
    rightLength: b.length,
    equalBytes: equal,
    similarity: max === 0 ? 1 : Number((equal / max).toFixed(4)),
    firstDiffOffset: firstDiff,
    preview,
  };
}
