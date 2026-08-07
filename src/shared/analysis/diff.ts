import { base64ToBytes, bytesToHex, hexToBytes, textToBytes } from '../encoding';

export type DiffEncoding = 'text' | 'hex' | 'base64';
export type DiffStatus = 'equal' | 'changed' | 'left-only' | 'right-only';

export interface DiffRun {
  status: DiffStatus;
  start: number;
  end: number;
  length: number;
}

export interface DiffResult {
  leftLength: number;
  rightLength: number;
  equalBytes: number;
  changedBytes: number;
  leftOnlyBytes: number;
  rightOnlyBytes: number;
  similarity: number;
  firstDiffOffset: number;
  preview: string[];
  runs: DiffRun[];
  changeOffsets: number[];
  changesTruncated: boolean;
}

export interface BinaryDiffCell {
  offset: number;
  left: number | null;
  right: number | null;
  status: DiffStatus;
}

export interface BinaryDiffRow {
  offset: number;
  cells: BinaryDiffCell[];
}

const MAX_NAVIGABLE_CHANGES = 10_000;

export function decodeDiffPayload(input: string, encoding: DiffEncoding): Uint8Array {
  if (encoding === 'text') return textToBytes(input);
  if (encoding === 'hex') {
    if (input.trim() === '') return new Uint8Array();
    const withoutPrefixes = input.replace(/0x/gi, '');
    if (/[^0-9a-f\s:,_-]/i.test(withoutPrefixes)) {
      throw new Error('Hex input must contain complete byte pairs and no non-hex characters.');
    }
    const cleaned = withoutPrefixes.replace(/[\s:,_-]/g, '');
    if (!cleaned || cleaned.length % 2 !== 0) {
      throw new Error('Hex input must contain complete byte pairs and no non-hex characters.');
    }
    return hexToBytes(cleaned);
  }
  try {
    return base64ToBytes(input);
  } catch {
    throw new Error('Base64 input is malformed.');
  }
}

export function diffStatusAt(
  left: Uint8Array,
  right: Uint8Array,
  offset: number,
): DiffStatus {
  if (offset >= left.length) return 'right-only';
  if (offset >= right.length) return 'left-only';
  return left[offset] === right[offset] ? 'equal' : 'changed';
}

export function buildBinaryDiffRows(
  left: Uint8Array,
  right: Uint8Array,
  start = 0,
  end = Math.max(left.length, right.length),
  bytesPerLine = 16,
): BinaryDiffRow[] {
  if (!Number.isInteger(bytesPerLine) || bytesPerLine <= 0) {
    throw new Error('Bytes per line must be a positive integer.');
  }
  const maxLength = Math.max(left.length, right.length);
  const first = Math.max(0, Math.min(start, maxLength));
  const last = Math.max(first, Math.min(end, maxLength));
  const rows: BinaryDiffRow[] = [];

  for (let offset = first; offset < last; offset += bytesPerLine) {
    const cells: BinaryDiffCell[] = [];
    const limit = Math.min(last, offset + bytesPerLine);
    for (let cursor = offset; cursor < limit; cursor += 1) {
      cells.push({
        offset: cursor,
        left: cursor < left.length ? left[cursor] : null,
        right: cursor < right.length ? right[cursor] : null,
        status: diffStatusAt(left, right, cursor),
      });
    }
    rows.push({ offset, cells });
  }
  return rows;
}

export function compareByteArrays(left: Uint8Array, right: Uint8Array): DiffResult {
  const max = Math.max(left.length, right.length);
  let equalBytes = 0;
  let changedBytes = 0;
  let leftOnlyBytes = 0;
  let rightOnlyBytes = 0;
  let firstDiffOffset = -1;
  const runs: DiffRun[] = [];
  const changeOffsets: number[] = [];
  let totalChanges = 0;

  for (let offset = 0; offset < max; offset += 1) {
    const status = diffStatusAt(left, right, offset);
    if (status === 'equal') equalBytes += 1;
    if (status === 'changed') changedBytes += 1;
    if (status === 'left-only') leftOnlyBytes += 1;
    if (status === 'right-only') rightOnlyBytes += 1;
    if (status !== 'equal') {
      totalChanges += 1;
      if (firstDiffOffset === -1) firstDiffOffset = offset;
      if (changeOffsets.length < MAX_NAVIGABLE_CHANGES) changeOffsets.push(offset);
    }

    const activeRun = runs.at(-1);
    if (activeRun?.status === status) {
      activeRun.end = offset + 1;
      activeRun.length += 1;
    } else {
      runs.push({ status, start: offset, end: offset + 1, length: 1 });
    }
  }

  const preview: string[] = [];
  const previewStart = Math.max(0, (firstDiffOffset === -1 ? 0 : firstDiffOffset) - 8);
  const previewEnd = Math.min(max, previewStart + 32);
  for (let offset = previewStart; offset < previewEnd; offset += 8) {
    const leftSlice = left.slice(offset, Math.min(left.length, offset + 8));
    const rightSlice = right.slice(offset, Math.min(right.length, offset + 8));
    preview.push(
      `${offset.toString(16).padStart(8, '0')}  L:${bytesToHex(leftSlice).padEnd(16, '·')}  R:${bytesToHex(rightSlice).padEnd(16, '·')}`,
    );
  }

  return {
    leftLength: left.length,
    rightLength: right.length,
    equalBytes,
    changedBytes,
    leftOnlyBytes,
    rightOnlyBytes,
    similarity: max === 0 ? 1 : Number((equalBytes / max).toFixed(6)),
    firstDiffOffset,
    preview,
    runs,
    changeOffsets,
    changesTruncated: totalChanges > changeOffsets.length,
  };
}

export function comparePayloads(
  left: string,
  right: string,
  encoding: DiffEncoding,
): DiffResult {
  return compareByteArrays(decodeDiffPayload(left, encoding), decodeDiffPayload(right, encoding));
}
